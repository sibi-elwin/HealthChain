const hre = require("hardhat");

async function main() {
  console.log("Deploying HealthChain contracts...");

  // Deploy AccessControlContract
  const AccessControlContract = await hre.ethers.getContractFactory("AccessControlContract");
  const accessControl = await AccessControlContract.deploy();
  await accessControl.waitForDeployment();
  const accessControlAddress = await accessControl.getAddress();
  console.log("AccessControlContract deployed to:", accessControlAddress);

  // Deploy RegistryContract
  const RegistryContract = await hre.ethers.getContractFactory("RegistryContract");
  const registry = await RegistryContract.deploy(accessControlAddress);
  await registry.waitForDeployment();
  const registryAddress = await registry.getAddress();
  console.log("RegistryContract deployed to:", registryAddress);

  // Deploy MedicalRecordContract
  const MedicalRecordContract = await hre.ethers.getContractFactory("MedicalRecordContract");
  const medicalRecord = await MedicalRecordContract.deploy(accessControlAddress);
  await medicalRecord.waitForDeployment();
  const medicalRecordAddress = await medicalRecord.getAddress();
  console.log("MedicalRecordContract deployed to:", medicalRecordAddress);

  // Wait for a few block confirmations
  console.log("Waiting for block confirmations...");
  const deployTx = await accessControl.deploymentTransaction();
  if (deployTx) {
    await deployTx.wait(5);
  }

  console.log("Deployment completed!");
  console.log("\nContract Addresses:");
  console.log("AccessControlContract:", accessControlAddress);
  console.log("RegistryContract:", registryAddress);
  console.log("MedicalRecordContract:", medicalRecordAddress);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 