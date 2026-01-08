// scripts/addSuperUser.ts
// Run this with: npx ts-node scripts/addSuperUser.ts
// This script ONLY adds Areeb Hayat without modifying existing users
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import FormData from '../models/FormData';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/EmployeeCentralHub';

async function addSuperUser() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    const superUser = {
      username: 'super.user',
      password: await bcrypt.hash('3265', 10),
      department: 'Super User',
      title: 'Super User',
      isDeptHead: true,
      basicDetails: {
        title: 'Mr',
        name: 'Areeb Hayat',
        fatherName: 'Shaukat Hayat',
        gender: '1',
        religion: 'Islam',
        nationality: 'PK',
        age: '22',
        maritalStatus: 'Single',
        profileImage: 'D:Uploads\\1763959111561-photo.JPG',
      },
      identification: {
        CNIC: '3740518199485',
        birthCountry: 'PK',
        dateOfBirth: '2002-12-10',
        drivingLicense: 'Yes',
        drivingLicenseNumber: '776913',
        dateOfMarriage: '2025-11-24',
        bloodGroup: 'O+',
        EOBI: '',
      },
      contactInformation: {
        contactNumber: '03355595166',
        telephoneNumber: '0000000000',
        email: 'areeb.hayat@pepsiisb.com',
        addressLine1: '33A, 1st Avenue, Sector A, DHA Phase 5',
        addressLine2: 'Islamabad, Pakistan',
        postalCode: '44800',
        district: 'Islamabad ',
        country: 'PK',
        emergencyNumber: '03335154672',
        emergencyRelation: 'Father',
      },
      educationalDetails: [
        {
          title: 'HSSC- FSC',
          degree: 'A-Levels',
          fromDate: '2019-08-24',
          toDate: '2021-08-24',
          country: 'PK',
          specialization: 'Sciences',
          institute: 'The Scince School',
          percentage: '82.72',
          selectedFile: 'D:Uploads\\1763959111586-IMG_8034.jpeg',
        },
        {
          title: 'Graduation- BS',
          degree: 'BS-CS',
          fromDate: '2021-08-24',
          toDate: '2025-08-24',
          country: 'PK',
          specialization: 'Computer Science',
          institute: 'FAST NUCES',
          percentage: '2.98',
          selectedFile: 'D:Uploads\\1763959111587-IMG_8033.jpeg',
        },
        {
          title: 'SSC - Matric',
          degree: 'O-levels',
          fromDate: '2016-08-24',
          toDate: '2019-08-24',
          country: 'PK',
          specialization: 'Sciences',
          institute: 'The Science School',
          percentage: '83.11',
          selectedFile: 'D:Uploads\\1763959111587-IMG_8035.jpeg',
        },
      ],
      certifications: [],
      employmentHistory: [],
      relatives: [
        {
          name: '0',
          relation: '0',
          designation: '0',
          department: '0',
        },
      ],
      parents: {
        father: {
          name: 'Shaukat Hayat',
          DOB: '1965-08-06',
          CNIC: '0000000000000',
        },
        mother: {
          name: 'Irum Nishat',
          DOB: '1967-07-03',
          CNIC: '0000000000000',
        },
      },
      dependants: {
        nominees: [
          {
            name: '0',
            address: '0',
            relationship: '0',
            amount: '0',
            age: '0',
            person: '0',
          },
        ],
        spouses: [
          {
            name: '0',
            DOB: '2025-11-24',
            CNIC: '0000000000000',
          },
        ],
        children: [
          {
            name: '0',
            DOB: '2025-11-24',
            gender: 'Prefer Not to Say',
            CNIC: '0000000000000',
          },
        ],
      },
      employeeGroup: 'C',
      employeeSubGroup: 'CT',
      joiningDate: '2025-11-24',
      personnelArea: '1000',
      employeeNumber: '70001877',
      status: 'approved',
    };

    // Check if user already exists
    const existingUser = await FormData.findOne({ username: superUser.username });
    
    if (existingUser) {
      console.log('⚠️  User already exists in database');
      console.log(`Username: ${existingUser.username}`);
      console.log(`Name: ${existingUser.basicDetails?.name}`);
      console.log(`Department: ${existingUser.department}`);
      console.log('\n❓ Do you want to update the password? If yes, delete the user first and re-run this script.');
    } else {
      // Add the new user
      await FormData.create(superUser);
      console.log('✅ Super user added successfully!\n');
      console.log('📋 Login credentials:');
      console.log('━'.repeat(60));
      console.log('Username: areeb.hayat@pepsiisb.com');
      console.log('Password: 3265');
      console.log('Department: Super User');
      console.log('Role: Admin (will be routed to /admin/dashboard)');
      console.log('━'.repeat(60));
    }

    // Show total users count
    const totalUsers = await FormData.countDocuments();
    console.log(`\n📊 Total users in database: ${totalUsers}`);

  } catch (error) {
    console.error('❌ Error adding super user:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n👋 Disconnected from MongoDB');
  }
}

addSuperUser();