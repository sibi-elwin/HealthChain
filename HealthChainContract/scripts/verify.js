const hre = require("hardhat");

async function main() {
    const accessControlAddress = "YOUR_ACCESS_CONTROL_ADDRESS";
    const registryAddress = "YOUR_REGISTRY_ADDRESS";
    const medicalRecordAddress = "YOUR_MEDICAL_RECORD_ADDRESS";

    console.log("Verifying contracts on Etherscan...");

    // Verify AccessControlContract
    await hre.run("verify:verify", {
        address: accessControlAddress,
        constructorArguments: [],
    });
    console.log("AccessControlContract verified");

    // Verify RegistryContract
    await hre.run("verify:verify", {
        address: registryAddress,
        constructorArguments: [accessControlAddress],
    });
    console.log("RegistryContract verified");

    // Verify MedicalRecordContract
    await hre.run("verify:verify", {
        address: medicalRecordAddress,
        constructorArguments: [accessControlAddress],
    });
    console.log("MedicalRecordContract verified");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    }); 