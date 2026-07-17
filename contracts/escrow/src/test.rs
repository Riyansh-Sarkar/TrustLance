#![cfg(test)]

use super::*;
use soroban_sdk::{testutils::Address as _, Address, Env, String, Vec, token};

fn deploy_test_contract(env: &Env) -> (EscrowContractClient<'_>, Address, Address, Address) {
    let contract_id = env.register(EscrowContract, ());
    let client = EscrowContractClient::new(env, &contract_id);
    let client_addr = Address::generate(env);
    let freelancer_addr = Address::generate(env);
    let admin_addr = Address::generate(env);
    (client, client_addr, freelancer_addr, admin_addr)
}

fn deploy_token(env: &Env) -> (Address, token::StellarAssetClient<'_>, token::Client<'_>) {
    let token_admin = Address::generate(env);
    let token_addr = env.register_stellar_asset_contract_v2(token_admin.clone()).address();
    let token_admin_client = token::StellarAssetClient::new(env, &token_addr);
    let token_client = token::Client::new(env, &token_addr);
    (token_addr, token_admin_client, token_client)
}

#[test]
fn test_escrow_flow() {
    let env = Env::default();
    env.mock_all_auths();

    let (_client, client_addr, freelancer_addr, _admin_addr) = deploy_test_contract(&env);
    let (token_addr, token_admin_client, token_client) = deploy_token(&env);
    token_admin_client.mint(&client_addr, &1000);

    let amounts = Vec::from_array(&env, [100, 200]);
    let descriptions = Vec::from_array(&env, [
        String::from_str(&env, "Milestone 1"),
        String::from_str(&env, "Milestone 2"),
    ]);

    let contract_id = env.register(EscrowContract, ());
    let client = EscrowContractClient::new(&env, &contract_id);
    let project_id = String::from_str(&env, "proj_1");

    client.initialize(
        &project_id,
        &client_addr,
        &freelancer_addr,
        &token_addr,
        &amounts,
        &descriptions,
    );

    assert_eq!(token_client.balance(&client_addr), 700);
    assert_eq!(token_client.balance(&contract_id), 300);

    let state = client.get_state(&project_id);
    assert!(state.initialized);
    assert_eq!(state.admin, client_addr);
    assert_eq!(state.milestones.len(), 2);
    assert_eq!(
        state.milestones.get(0).unwrap().status,
        MilestoneStatus::Pending
    );
}

#[test]
fn test_submit_and_approve_milestone() {
    let env = Env::default();
    env.mock_all_auths();

    let (_client, client_addr, freelancer_addr, _admin_addr) = deploy_test_contract(&env);
    let (token_addr, token_admin_client, token_client) = deploy_token(&env);
    token_admin_client.mint(&client_addr, &1000);

    let amounts = Vec::from_array(&env, [150]);
    let descriptions = Vec::from_array(&env, [String::from_str(&env, "Deliverable A")]);

    let contract_id = env.register(EscrowContract, ());
    let client = EscrowContractClient::new(&env, &contract_id);
    let project_id = String::from_str(&env, "proj_1");

    client.initialize(
        &project_id,
        &client_addr,
        &freelancer_addr,
        &token_addr,
        &amounts,
        &descriptions,
    );

    client.submit_milestone(&project_id, &0);
    let state = client.get_state(&project_id);
    assert_eq!(
        state.milestones.get(0).unwrap().status,
        MilestoneStatus::Submitted
    );

    client.approve_milestone(&project_id, &0);
    let state = client.get_state(&project_id);
    assert_eq!(
        state.milestones.get(0).unwrap().status,
        MilestoneStatus::Released
    );
    assert_eq!(token_client.balance(&contract_id), 0);
    assert_eq!(token_client.balance(&freelancer_addr), 150);
}

#[test]
fn test_dispute_flow() {
    let env = Env::default();
    env.mock_all_auths();

    let (_client, client_addr, freelancer_addr, _admin_addr) = deploy_test_contract(&env);
    let (token_addr, token_admin_client, token_client) = deploy_token(&env);
    token_admin_client.mint(&client_addr, &500);

    let amounts = Vec::from_array(&env, [500]);
    let descriptions = Vec::from_array(&env, [String::from_str(&env, "Project")]);

    let contract_id = env.register(EscrowContract, ());
    let client = EscrowContractClient::new(&env, &contract_id);
    let project_id = String::from_str(&env, "proj_1");

    client.initialize(
        &project_id,
        &client_addr,
        &freelancer_addr,
        &token_addr,
        &amounts,
        &descriptions,
    );

    client.flag_dispute(&project_id, &client_addr);
    let state = client.get_state(&project_id);
    assert!(state.is_disputed);

    client.resolve_dispute(&project_id, &client_addr, &client_addr, &500);
    assert_eq!(token_client.balance(&contract_id), 0);
    assert_eq!(token_client.balance(&client_addr), 500);

    let state = client.get_state(&project_id);
    assert!(!state.is_disputed);
}

#[test]
#[should_panic(expected = "AlreadyInitialized")]
fn test_initialize_twice_should_fail() {
    let env = Env::default();
    env.mock_all_auths();

    let (_client, client_addr, freelancer_addr, _admin_addr) = deploy_test_contract(&env);
    let (token_addr, token_admin_client, _) = deploy_token(&env);
    token_admin_client.mint(&client_addr, &1000);

    let amounts = Vec::from_array(&env, [100]);
    let descriptions = Vec::from_array(&env, [String::from_str(&env, "M1")]);

    let contract_id = env.register(EscrowContract, ());
    let client = EscrowContractClient::new(&env, &contract_id);
    let project_id = String::from_str(&env, "proj_1");

    client.initialize(
        &project_id,
        &client_addr,
        &freelancer_addr,
        &token_addr,
        &amounts,
        &descriptions,
    );
    client.initialize(
        &project_id,
        &client_addr,
        &freelancer_addr,
        &token_addr,
        &amounts,
        &descriptions,
    );
}

#[test]
#[should_panic(expected = "Unauthorized")]
fn test_resolve_dispute_unauthorized() {
    let env = Env::default();
    env.mock_all_auths();

    let (_client, client_addr, freelancer_addr, _admin_addr) = deploy_test_contract(&env);
    let (token_addr, token_admin_client, _) = deploy_token(&env);
    token_admin_client.mint(&client_addr, &500);

    let amounts = Vec::from_array(&env, [500]);
    let descriptions = Vec::from_array(&env, [String::from_str(&env, "Project")]);

    let contract_id = env.register(EscrowContract, ());
    let client = EscrowContractClient::new(&env, &contract_id);
    let project_id = String::from_str(&env, "proj_1");

    client.initialize(
        &project_id,
        &client_addr,
        &freelancer_addr,
        &token_addr,
        &amounts,
        &descriptions,
    );

    client.flag_dispute(&project_id, &client_addr);

    client.resolve_dispute(&project_id, &freelancer_addr, &freelancer_addr, &500);
}

#[test]
#[should_panic(expected = "NotDisputed")]
fn test_resolve_dispute_when_not_disputed() {
    let env = Env::default();
    env.mock_all_auths();

    let (_client, client_addr, freelancer_addr, _admin_addr) = deploy_test_contract(&env);
    let (token_addr, token_admin_client, _) = deploy_token(&env);
    token_admin_client.mint(&client_addr, &500);

    let amounts = Vec::from_array(&env, [500]);
    let descriptions = Vec::from_array(&env, [String::from_str(&env, "Project")]);

    let contract_id = env.register(EscrowContract, ());
    let client = EscrowContractClient::new(&env, &contract_id);
    let project_id = String::from_str(&env, "proj_1");

    client.initialize(
        &project_id,
        &client_addr,
        &freelancer_addr,
        &token_addr,
        &amounts,
        &descriptions,
    );

    client.resolve_dispute(&project_id, &client_addr, &freelancer_addr, &500);
}

#[test]
#[should_panic(expected = "InsufficientBalance")]
fn test_resolve_dispute_insufficient_balance() {
    let env = Env::default();
    env.mock_all_auths();

    let (_client, client_addr, freelancer_addr, _admin_addr) = deploy_test_contract(&env);
    let (token_addr, token_admin_client, _) = deploy_token(&env);
    token_admin_client.mint(&client_addr, &300);

    let amounts = Vec::from_array(&env, [300]);
    let descriptions = Vec::from_array(&env, [String::from_str(&env, "Project")]);

    let contract_id = env.register(EscrowContract, ());
    let client = EscrowContractClient::new(&env, &contract_id);
    let project_id = String::from_str(&env, "proj_1");

    client.initialize(
        &project_id,
        &client_addr,
        &freelancer_addr,
        &token_addr,
        &amounts,
        &descriptions,
    );

    client.flag_dispute(&project_id, &client_addr);

    client.resolve_dispute(&project_id, &client_addr, &freelancer_addr, &9999);
}

#[test]
#[should_panic(expected = "NotAParty")]
fn test_flag_dispute_by_non_party() {
    let env = Env::default();
    env.mock_all_auths();

    let (_client, client_addr, freelancer_addr, _admin_addr) = deploy_test_contract(&env);
    let (token_addr, token_admin_client, _) = deploy_token(&env);
    token_admin_client.mint(&client_addr, &300);

    let amounts = Vec::from_array(&env, [300]);
    let descriptions = Vec::from_array(&env, [String::from_str(&env, "Project")]);

    let contract_id = env.register(EscrowContract, ());
    let client = EscrowContractClient::new(&env, &contract_id);
    let project_id = String::from_str(&env, "proj_1");

    client.initialize(
        &project_id,
        &client_addr,
        &freelancer_addr,
        &token_addr,
        &amounts,
        &descriptions,
    );

    let stranger = Address::generate(&env);
    client.flag_dispute(&project_id, &stranger);
}

#[test]
#[should_panic(expected = "InvalidStatus")]
fn test_approve_pending_should_fail() {
    let env = Env::default();
    env.mock_all_auths();

    let (_client, client_addr, freelancer_addr, _admin_addr) = deploy_test_contract(&env);
    let (token_addr, token_admin_client, _) = deploy_token(&env);
    token_admin_client.mint(&client_addr, &300);

    let amounts = Vec::from_array(&env, [300]);
    let descriptions = Vec::from_array(&env, [String::from_str(&env, "Project")]);

    let contract_id = env.register(EscrowContract, ());
    let client = EscrowContractClient::new(&env, &contract_id);
    let project_id = String::from_str(&env, "proj_1");

    client.initialize(
        &project_id,
        &client_addr,
        &freelancer_addr,
        &token_addr,
        &amounts,
        &descriptions,
    );

    client.approve_milestone(&project_id, &0);
}
