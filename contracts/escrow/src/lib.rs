#![no_std]
use soroban_sdk::{
    contract, contractimpl, contracttype, contracterror,
    token, Address, Env, String, Vec,
};

#[contracttype]
#[derive(Clone, Debug, PartialEq)]
pub enum MilestoneStatus {
    Pending,
    Submitted,
    Approved,
    Released,
    Disputed,
}

#[contracttype]
#[derive(Clone)]
pub struct Milestone {
    pub id: u32,
    pub description: String,
    pub amount: i128,
    pub status: MilestoneStatus,
}

#[contracttype]
#[derive(Clone)]
pub struct EscrowState {
    pub client: Address,
    pub freelancer: Address,
    pub admin: Address,
    pub token: Address,
    pub total_amount: i128,
    pub milestones: Vec<Milestone>,
    pub is_disputed: bool,
    pub is_closed: bool,
    pub initialized: bool,
}

#[contracttype]
pub enum DataKey {
    Escrow(String),
}

#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq, PartialOrd, Ord)]
#[repr(u32)]
pub enum Error {
    AlreadyInitialized = 1,
    NotInitialized = 2,
    NotDisputed = 3,
    Unauthorized = 4,
    InsufficientBalance = 5,
    InvalidMilestoneId = 6,
    InvalidStatus = 7,
    NotAParty = 8,
}

#[contract]
pub struct EscrowContract;

fn err(env: &Env, e: Error) {
    env.events()
        .publish(("error",), e as u32);
    panic!("{:?}", e);
}

#[contractimpl]
impl EscrowContract {
    pub fn initialize(
        env: Env,
        project_id: String,
        client: Address,
        freelancer: Address,
        token: Address,
        milestone_amounts: Vec<i128>,
        milestone_descriptions: Vec<String>,
    ) -> u32 {
        client.require_auth();

        if milestone_amounts.is_empty() {
            err(&env, Error::InvalidMilestoneId);
        }

        let data_key = DataKey::Escrow(project_id.clone());
        let len_opt = env.storage().persistent().get::<_, EscrowState>(&data_key);
        if let Some(state) = len_opt {
            if state.initialized {
                err(&env, Error::AlreadyInitialized);
            }
        }

        let total: i128 = milestone_amounts.iter().sum();
        let mut milestones: Vec<Milestone> = Vec::new(&env);

        for i in 0..milestone_amounts.len() {
            milestones.push_back(Milestone {
                id: i,
                description: milestone_descriptions.get(i).unwrap(),
                amount: milestone_amounts.get(i).unwrap(),
                status: MilestoneStatus::Pending,
            });
        }

        let state = EscrowState {
            client: client.clone(),
            freelancer,
            admin: client.clone(),
            token: token.clone(),
            total_amount: total,
            milestones,
            is_disputed: false,
            is_closed: false,
            initialized: true,
        };

        env.storage().persistent().set(&data_key, &state);

        let token_client = token::Client::new(&env, &token);
        token_client.transfer(&client, &env.current_contract_address(), &total);

        0
    }

    fn load_state(env: &Env, project_id: &String) -> EscrowState {
        match env.storage().persistent().get::<_, EscrowState>(&DataKey::Escrow(project_id.clone())) {
            Some(s) => {
                if s.initialized {
                    s
                } else {
                    err(env, Error::NotInitialized);
                    unreachable!()
                }
            }
            None => {
                err(env, Error::NotInitialized);
                unreachable!()
            }
        }
    }

    pub fn submit_milestone(env: Env, project_id: String, milestone_id: u32) {
        let mut state = Self::load_state(&env, &project_id);
        env.events().publish(("expected_freelancer",), state.freelancer.clone());
        state.freelancer.require_auth();

        if milestone_id >= state.milestones.len() {
            err(&env, Error::InvalidMilestoneId);
        }

        let mut milestone = state.milestones.get(milestone_id).unwrap();
        if milestone.status != MilestoneStatus::Pending {
            err(&env, Error::InvalidStatus);
        }
        milestone.status = MilestoneStatus::Submitted;
        state.milestones.set(milestone_id, milestone);

        env.storage().persistent().set(&DataKey::Escrow(project_id), &state);
    }

    pub fn approve_milestone(env: Env, project_id: String, milestone_id: u32) {
        let mut state = Self::load_state(&env, &project_id);
        env.events().publish(("expected_client",), state.client.clone());
        state.client.require_auth();

        if state.is_disputed {
            err(&env, Error::NotDisputed);
        }
        if milestone_id >= state.milestones.len() {
            err(&env, Error::InvalidMilestoneId);
        }

        let mut milestone = state.milestones.get(milestone_id).unwrap();
        if milestone.status != MilestoneStatus::Submitted {
            err(&env, Error::InvalidStatus);
        }

        let token_client = token::Client::new(&env, &state.token);
        let contract_balance = token_client.balance(&env.current_contract_address());
        if contract_balance < milestone.amount {
            err(&env, Error::InsufficientBalance);
        }

        milestone.status = MilestoneStatus::Released;
        state.milestones.set(milestone_id, milestone.clone());
        env.storage().persistent().set(&DataKey::Escrow(project_id.clone()), &state);

        token_client.transfer(
            &env.current_contract_address(),
            &state.freelancer,
            &milestone.amount,
        );
    }

    pub fn flag_dispute(env: Env, project_id: String, caller: Address) {
        caller.require_auth();
        let mut state = Self::load_state(&env, &project_id);
        if caller != state.client && caller != state.freelancer {
            err(&env, Error::NotAParty);
        }
        state.is_disputed = true;
        env.storage().persistent().set(&DataKey::Escrow(project_id), &state);
    }

    pub fn resolve_dispute(env: Env, project_id: String, resolver: Address, release_to: Address, amount: i128) {
        resolver.require_auth();

        let mut state = Self::load_state(&env, &project_id);

        if resolver != state.admin {
            err(&env, Error::Unauthorized);
        }
        if !state.is_disputed {
            err(&env, Error::NotDisputed);
        }

        let token_client = token::Client::new(&env, &state.token);
        let contract_balance = token_client.balance(&env.current_contract_address());
        if amount <= 0 || amount > contract_balance {
            err(&env, Error::InsufficientBalance);
        }

        state.is_disputed = false;
        env.storage().persistent().set(&DataKey::Escrow(project_id.clone()), &state);

        token_client.transfer(&env.current_contract_address(), &release_to, &amount);
    }

    pub fn cancel_contract(env: Env, project_id: String) {
        let mut state = Self::load_state(&env, &project_id);
        state.client.require_auth();

        if state.is_closed {
            err(&env, Error::InvalidStatus);
        }

        // Only allow cancellation if no milestone has progressed past Pending
        for milestone in state.milestones.iter() {
            if milestone.status != MilestoneStatus::Pending {
                err(&env, Error::InvalidStatus);
            }
        }

        let token_client = token::Client::new(&env, &state.token);
        let contract_balance = token_client.balance(&env.current_contract_address());
        
        if contract_balance > 0 {
            // Wait, we shouldn't transfer all contract balance, only state.total_amount that hasn't been paid!
            // But if all milestones are Pending, nothing has been paid yet.
            // So refunding state.total_amount is correct!
            // Let's fix this bug.
            if contract_balance < state.total_amount {
               err(&env, Error::InsufficientBalance);
            }
            token_client.transfer(&env.current_contract_address(), &state.client, &state.total_amount);
        }

        state.is_closed = true;
        env.storage().persistent().set(&DataKey::Escrow(project_id), &state);
    }

    pub fn get_state(env: Env, project_id: String) -> EscrowState {
        Self::load_state(&env, &project_id)
    }
}

#[cfg(test)]
mod test;