#![cfg(test)]

use super::*;
use soroban_sdk::{testutils::Address as _, Address, Env, token};

#[test]
fn test_initial_state() {
    let env = Env::default();
    env.mock_all_auths();

    let contract_id = env.register(LiquidityPool, ());
    let client = LiquidityPoolClient::new(&env, &contract_id);

    let admin = Address::generate(&env);
    let token_admin = Address::generate(&env);
    let token_a = env.register_stellar_asset_contract_v2(token_admin.clone()).address();
    let token_b = env.register_stellar_asset_contract_v2(token_admin).address();

    client.initialize(&admin, &token_a, &token_b);
    let info = client.get_info();
    assert_eq!(info.reserve_a, 0);
    assert_eq!(info.reserve_b, 0);
    assert_eq!(info.total_lp_shares, 0);
}

#[test]
fn test_first_deposit_mints_lp_shares() {
    let env = Env::default();
    env.mock_all_auths();

    let contract_id = env.register(LiquidityPool, ());
    let client = LiquidityPoolClient::new(&env, &contract_id);

    let admin = Address::generate(&env);
    let token_admin = Address::generate(&env);
    let token_a = env.register_stellar_asset_contract_v2(token_admin.clone()).address();
    let token_b = env.register_stellar_asset_contract_v2(token_admin.clone()).address();
    client.initialize(&admin, &token_a, &token_b);

    let user = Address::generate(&env);
    let sac_a = token::StellarAssetClient::new(&env, &token_a);
    let sac_b = token::StellarAssetClient::new(&env, &token_b);
    sac_a.mint(&user, &100_000_000);
    sac_b.mint(&user, &10_000_000);

    let shares = client.add_liquidity(&user, &100_000_000_i128, &10_000_000_i128, &0_i128);
    assert!(shares > 0);
    assert_eq!(client.get_lp_balance(&user), shares);
}

#[test]
fn test_double_init_rejected() {
    let env = Env::default();
    env.mock_all_auths();

    let contract_id = env.register(LiquidityPool, ());
    let client = LiquidityPoolClient::new(&env, &contract_id);

    let admin = Address::generate(&env);
    let token_a = Address::generate(&env);
    let token_b = Address::generate(&env);
    client.initialize(&admin, &token_a, &token_b);

    let res = client.try_initialize(&admin, &token_a, &token_b);
    assert!(res.is_err());
}
