#![no_std]

use soroban_sdk::{contract, contractimpl, Address, Env};

#[derive(Clone)]
#[soroban_sdk::contracttype]
pub enum DataKey {
    TokenA,
    TokenB,
    ReserveA,
    ReserveB,
    Admin,
    TotalLpShares,
    LpBalance(Address),
}

#[derive(Clone, Copy, Debug, Eq, PartialEq)]
#[soroban_sdk::contracterror]
pub enum PoolError {
    NotInitialized = 1,
    AlreadyInitialized = 2,
    InsufficientLiquidity = 3,
    InvalidAmount = 4,
    SlippageExceeded = 5,
    Unauthorized = 6,
    MathOverflow = 7,
    UnknownAsset = 8,
}

#[derive(Clone)]
#[soroban_sdk::contracttype]
pub struct PoolInfo {
    pub token_a: Address,
    pub token_b: Address,
    pub reserve_a: i128,
    pub reserve_b: i128,
    pub total_lp_shares: i128,
}

#[contract]
pub struct LiquidityPool;

#[contractimpl]
impl LiquidityPool {
    pub fn initialize(
        env: Env,
        admin: Address,
        token_a: Address,
        token_b: Address,
    ) -> Result<(), PoolError> {
        if env
            .storage()
            .instance()
            .has(&DataKey::TokenA)
        {
            return Err(PoolError::AlreadyInitialized);
        }
        admin.require_auth();
        env.storage().instance().set(&DataKey::Admin, &admin);
        env.storage().instance().set(&DataKey::TokenA, &token_a);
        env.storage().instance().set(&DataKey::TokenB, &token_b);
        env.storage().instance().set(&DataKey::ReserveA, &0_i128);
        env.storage().instance().set(&DataKey::ReserveB, &0_i128);
        env.storage().instance().set(&DataKey::TotalLpShares, &0_i128);
        Ok(())
    }

    pub fn add_liquidity(
        env: Env,
        user: Address,
        amount_a: i128,
        amount_b: i128,
        min_lp_shares: i128,
    ) -> Result<i128, PoolError> {
        user.require_auth();
        if amount_a <= 0 || amount_b <= 0 {
            return Err(PoolError::InvalidAmount);
        }
        let token_a: Address = env
            .storage()
            .instance()
            .get(&DataKey::TokenA)
            .ok_or(PoolError::NotInitialized)?;
        let token_b: Address = env
            .storage()
            .instance()
            .get(&DataKey::TokenB)
            .ok_or(PoolError::NotInitialized)?;
        let reserve_a: i128 = env.storage().instance().get(&DataKey::ReserveA).unwrap_or(0);
        let reserve_b: i128 = env.storage().instance().get(&DataKey::ReserveB).unwrap_or(0);
        let total_lp: i128 = env
            .storage()
            .instance()
            .get(&DataKey::TotalLpShares)
            .unwrap_or(0);

        let shares: i128 = if total_lp == 0 {
            let product = amount_a
                .checked_mul(amount_b)
                .ok_or(PoolError::MathOverflow)?;
            integer_sqrt(product)
        } else {
            let share_a = amount_a
                .checked_mul(total_lp)
                .and_then(|v| v.checked_div(reserve_a))
                .ok_or(PoolError::MathOverflow)?;
            let share_b = amount_b
                .checked_mul(total_lp)
                .and_then(|v| v.checked_div(reserve_b))
                .ok_or(PoolError::MathOverflow)?;
            if share_a < share_b { share_a } else { share_b }
        };

        if shares < min_lp_shares {
            return Err(PoolError::SlippageExceeded);
        }

        soroban_sdk::token::Client::new(&env, &token_a).transfer(
            &user,
            &env.current_contract_address(),
            &amount_a,
        );
        soroban_sdk::token::Client::new(&env, &token_b).transfer(
            &user,
            &env.current_contract_address(),
            &amount_b,
        );

        let user_lp: i128 = env
            .storage()
            .instance()
            .get(&DataKey::LpBalance(user.clone()))
            .unwrap_or(0);
        env.storage().instance().set(
            &DataKey::LpBalance(user.clone()),
            &(user_lp + shares),
        );
        env.storage()
            .instance()
            .set(&DataKey::ReserveA, &(reserve_a + amount_a));
        env.storage()
            .instance()
            .set(&DataKey::ReserveB, &(reserve_b + amount_b));
        env.storage()
            .instance()
            .set(&DataKey::TotalLpShares, &(total_lp + shares));

        Ok(shares)
    }

    pub fn swap(
        env: Env,
        user: Address,
        send_token: Address,
        send_amount: i128,
        min_dest_amount: i128,
    ) -> Result<i128, PoolError> {
        user.require_auth();
        if send_amount <= 0 {
            return Err(PoolError::InvalidAmount);
        }
        let token_a: Address = env
            .storage()
            .instance()
            .get(&DataKey::TokenA)
            .ok_or(PoolError::NotInitialized)?;
        let token_b: Address = env
            .storage()
            .instance()
            .get(&DataKey::TokenB)
            .ok_or(PoolError::NotInitialized)?;

        let (reserve_in, reserve_out, in_addr, out_addr, send_is_a): (
            i128,
            i128,
            Address,
            Address,
            bool,
        ) =
            if send_token == token_a {
                let ra = env.storage().instance().get(&DataKey::ReserveA).unwrap_or(0);
                let rb = env.storage().instance().get(&DataKey::ReserveB).unwrap_or(0);
                (ra, rb, token_a.clone(), token_b.clone(), true)
            } else if send_token == token_b {
                let ra = env.storage().instance().get(&DataKey::ReserveA).unwrap_or(0);
                let rb = env.storage().instance().get(&DataKey::ReserveB).unwrap_or(0);
                (rb, ra, token_b, token_a, false)
            } else {
                return Err(PoolError::UnknownAsset);
            };

        if reserve_in == 0 || reserve_out == 0 {
            return Err(PoolError::InsufficientLiquidity);
        }

        let amount_in_with_fee = send_amount
            .checked_mul(997)
            .ok_or(PoolError::MathOverflow)?;
        let numerator = amount_in_with_fee
            .checked_mul(reserve_out)
            .ok_or(PoolError::MathOverflow)?;
        let denominator = reserve_in
            .checked_mul(1000)
            .and_then(|v| v.checked_add(amount_in_with_fee))
            .ok_or(PoolError::MathOverflow)?;
        let dest_amount = numerator
            .checked_div(denominator)
            .ok_or(PoolError::MathOverflow)?;

        if dest_amount < min_dest_amount {
            return Err(PoolError::SlippageExceeded);
        }

        soroban_sdk::token::Client::new(&env, &in_addr).transfer(
            &user,
            &env.current_contract_address(),
            &send_amount,
        );
        soroban_sdk::token::Client::new(&env, &out_addr).transfer(
            &env.current_contract_address(),
            &user,
            &dest_amount,
        );

        if send_is_a {
            let new_ra: i128 = reserve_in + send_amount;
            let new_rb: i128 = reserve_out - dest_amount;
            env.storage().instance().set(&DataKey::ReserveA, &new_ra);
            env.storage().instance().set(&DataKey::ReserveB, &new_rb);
        } else {
            let new_rb: i128 = reserve_in + send_amount;
            let new_ra: i128 = reserve_out - dest_amount;
            env.storage().instance().set(&DataKey::ReserveA, &new_ra);
            env.storage().instance().set(&DataKey::ReserveB, &new_rb);
        }

        Ok(dest_amount)
    }

    pub fn get_reserves(env: Env) -> Result<(i128, i128), PoolError> {
        if !env.storage().instance().has(&DataKey::TokenA) {
            return Err(PoolError::NotInitialized);
        }
        let r_a = env
            .storage()
            .instance()
            .get(&DataKey::ReserveA)
            .unwrap_or(0);
        let r_b = env
            .storage()
            .instance()
            .get(&DataKey::ReserveB)
            .unwrap_or(0);
        Ok((r_a, r_b))
    }

    pub fn get_info(env: Env) -> Result<PoolInfo, PoolError> {
        if !env.storage().instance().has(&DataKey::TokenA) {
            return Err(PoolError::NotInitialized);
        }
        Ok(PoolInfo {
            token_a: env.storage().instance().get(&DataKey::TokenA).ok_or(PoolError::NotInitialized)?,
            token_b: env.storage().instance().get(&DataKey::TokenB).ok_or(PoolError::NotInitialized)?,
            reserve_a: env.storage().instance().get(&DataKey::ReserveA).unwrap_or(0),
            reserve_b: env.storage().instance().get(&DataKey::ReserveB).unwrap_or(0),
            total_lp_shares: env
                .storage()
                .instance()
                .get(&DataKey::TotalLpShares)
                .unwrap_or(0),
        })
    }

    pub fn get_lp_balance(env: Env, user: Address) -> i128 {
        env.storage()
            .instance()
            .get(&DataKey::LpBalance(user))
            .unwrap_or(0)
    }
}

fn integer_sqrt(value: i128) -> i128 {
    if value <= 0 {
        return 0;
    }
    let mut x = value;
    let mut y = (x + 1) / 2;
    while y < x {
        x = y;
        y = (x + value / x) / 2;
    }
    x
}

#[cfg(test)]
mod test;

