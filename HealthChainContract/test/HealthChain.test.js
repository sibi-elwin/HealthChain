const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("HealthChain", function () {
    let AccessControlContract;
    let MedicalRecordContract;
    let RegistryContract;
    let accessControl;
    let medicalRecord;
    let registry;
    let owner;
    let admin;
    let doctor;
    let patient;
    let lab;
    let other;

    beforeEach(async function () {
        [owner, admin, doctor, patient, lab, other] = await ethers.getSigners();

        // Deploy AccessControlContract
        AccessControlContract = await ethers.getContractFactory("AccessControlContract");
        accessControl = await AccessControlContract.deploy();
        await accessControl.waitForDeployment();

        // Deploy RegistryContract
        RegistryContract = await ethers.getContractFactory("RegistryContract");
        registry = await RegistryContract.deploy(await accessControl.getAddress());
        await registry.waitForDeployment();

        // Deploy MedicalRecordContract
        MedicalRecordContract = await ethers.getContractFactory("MedicalRecordContract");
        medicalRecord = await MedicalRecordContract.deploy(await accessControl.getAddress());
        await medicalRecord.waitForDeployment();

        // Setup initial roles
        await accessControl.grantRole(await accessControl.ADMIN_ROLE(), admin.address);
        await accessControl.grantRole(await accessControl.DOCTOR_ROLE(), doctor.address);
        await accessControl.grantRole(await accessControl.PATIENT_ROLE(), patient.address);
        await accessControl.grantRole(await accessControl.LAB_ROLE(), lab.address);
    });

    describe("AccessControlContract", function () {
        describe("Role Management", function () {
            it("Should assign correct roles during deployment", async function () {
                expect(await accessControl.hasRole(await accessControl.ADMIN_ROLE(), admin.address)).to.be.true;
                expect(await accessControl.hasRole(await accessControl.DOCTOR_ROLE(), doctor.address)).to.be.true;
                expect(await accessControl.hasRole(await accessControl.PATIENT_ROLE(), patient.address)).to.be.true;
                expect(await accessControl.hasRole(await accessControl.LAB_ROLE(), lab.address)).to.be.true;
            });

            it("Should allow admin to grant roles", async function () {
                await accessControl.connect(admin).grantRole(await accessControl.DOCTOR_ROLE(), other.address);
                expect(await accessControl.hasRole(await accessControl.DOCTOR_ROLE(), other.address)).to.be.true;
            });

            it("Should allow admin to revoke roles", async function () {
                await accessControl.connect(admin).revokeRole(await accessControl.DOCTOR_ROLE(), doctor.address);
                expect(await accessControl.hasRole(await accessControl.DOCTOR_ROLE(), doctor.address)).to.be.false;
            });

            it("Should prevent non-admin from granting roles", async function () {
                await expect(
                    accessControl.connect(doctor).grantRole(await accessControl.DOCTOR_ROLE(), other.address)
                ).to.be.revertedWith(/AccessControl: account .* is missing role .*/);
            });
        });

        describe("Pause Functionality", function () {
            it("Should allow admin to pause and unpause", async function () {
                await accessControl.connect(admin).pause();
                expect(await accessControl.paused()).to.be.true;

                await accessControl.connect(admin).unpause();
                expect(await accessControl.paused()).to.be.false;
            });

            it("Should prevent non-admin from pausing", async function () {
                await expect(
                    accessControl.connect(doctor).pause()
                ).to.be.revertedWith(/AccessControl: account .* is missing role .*/);
            });
        });
    });

    describe("MedicalRecordContract", function () {
        const testCid = "QmTest123";
        const testFileType = "XRay";
        const testDescription = "Test record";

        describe("Record Management", function () {
            it("Should allow doctor to add record", async function () {
                await expect(
                    medicalRecord.connect(doctor).addRecord(
                        patient.address,
                        testCid,
                        testFileType,
                        testDescription
                    )
                ).to.emit(medicalRecord, "RecordAdded")
                    .withArgs(1, patient.address, doctor.address, testCid);
            });

            it("Should allow lab to add record", async function () {
                await expect(
                    medicalRecord.connect(lab).addRecord(
                        patient.address,
                        testCid,
                        testFileType,
                        testDescription
                    )
                ).to.emit(medicalRecord, "RecordAdded");
            });

            it("Should prevent non-doctor/lab from adding records", async function () {
                await expect(
                    medicalRecord.connect(patient).addRecord(
                        patient.address,
                        testCid,
                        testFileType,
                        testDescription
                    )
                ).to.be.revertedWith("Only doctors or labs can add records");
            });
        });

        describe("Access Control", function () {
            it("Should allow patient to grant access to doctor", async function () {
                await expect(
                    medicalRecord.connect(patient).grantAccess(doctor.address)
                ).to.emit(medicalRecord, "AccessGranted")
                    .withArgs(patient.address, doctor.address);
            });

            it("Should allow patient to revoke access from doctor", async function () {
                await medicalRecord.connect(patient).grantAccess(doctor.address);
                await expect(
                    medicalRecord.connect(patient).revokeAccess(doctor.address)
                ).to.emit(medicalRecord, "AccessRevoked")
                    .withArgs(patient.address, doctor.address);
            });

            it("Should prevent non-patient from granting access", async function () {
                await expect(
                    medicalRecord.connect(doctor).grantAccess(other.address)
                ).to.be.revertedWith("Only patients can grant access");
            });
        });

        describe("Record Access", function () {
            beforeEach(async function () {
                await medicalRecord.connect(doctor).addRecord(
                    patient.address,
                    testCid,
                    testFileType,
                    testDescription
                );
            });

            it("Should allow patient to view their own records", async function () {
                const record = await medicalRecord.connect(patient).getRecord(1);
                expect(record.cid).to.equal(testCid);
            });

            it("Should allow doctor with access to view patient records", async function () {
                await medicalRecord.connect(patient).grantAccess(doctor.address);
                const record = await medicalRecord.connect(doctor).getRecord(1);
                expect(record.cid).to.equal(testCid);
            });

            it("Should prevent unauthorized access to records", async function () {
                await expect(
                    medicalRecord.connect(other).getRecord(1)
                ).to.be.revertedWith("No access to this record");
            });
        });
    });

    describe("RegistryContract", function () {
        const testName = "Dr. Smith";
        const testSpecialization = "Cardiology";
        const testLicense = "MD123456";
        const testOrg = "City Hospital";

        describe("Entity Registration", function () {
            it("Should allow admin to register entity", async function () {
                await expect(
                    registry.connect(admin).registerEntity(
                        doctor.address,
                        testName,
                        testSpecialization,
                        testLicense,
                        testOrg
                    )
                ).to.emit(registry, "EntityRegistered")
                    .withArgs(doctor.address, "New Entity");
            });

            it("Should prevent non-admin from registering entity", async function () {
                await expect(
                    registry.connect(doctor).registerEntity(
                        other.address,
                        testName,
                        testSpecialization,
                        testLicense,
                        testOrg
                    )
                ).to.be.revertedWith("Only admin can register entities");
            });

            it("Should prevent duplicate registration", async function () {
                await registry.connect(admin).registerEntity(
                    doctor.address,
                    testName,
                    testSpecialization,
                    testLicense,
                    testOrg
                );

                await expect(
                    registry.connect(admin).registerEntity(
                        doctor.address,
                        testName,
                        testSpecialization,
                        testLicense,
                        testOrg
                    )
                ).to.be.revertedWith("Entity already registered");
            });
        });

        describe("Entity Management", function () {
            beforeEach(async function () {
                await registry.connect(admin).registerEntity(
                    doctor.address,
                    testName,
                    testSpecialization,
                    testLicense,
                    testOrg
                );
            });

            it("Should allow admin to update entity", async function () {
                const newName = "Dr. John Smith";
                await expect(
                    registry.connect(admin).updateEntity(
                        doctor.address,
                        newName,
                        testSpecialization,
                        testLicense,
                        testOrg
                    )
                ).to.emit(registry, "EntityUpdated")
                    .withArgs(doctor.address);

                const info = await registry.getEntityInfo(doctor.address);
                expect(info.name).to.equal(newName);
            });

            it("Should allow entity to update their own info", async function () {
                const newName = "Dr. John Smith";
                await expect(
                    registry.connect(doctor).updateEntity(
                        doctor.address,
                        newName,
                        testSpecialization,
                        testLicense,
                        testOrg
                    )
                ).to.emit(registry, "EntityUpdated");
            });

            it("Should allow admin to deactivate entity", async function () {
                await expect(
                    registry.connect(admin).deactivateEntity(doctor.address)
                ).to.emit(registry, "EntityDeactivated")
                    .withArgs(doctor.address);

                expect(await registry.isEntityActive(doctor.address)).to.be.false;
            });
        });
    });
}); 