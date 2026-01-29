// app/api/orgChart/route.ts
import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongoose';
import FormData from '@/models/FormData';
import ExecutiveDepartments from '@/models/ExecutiveDepartments';

export async function GET(req: NextRequest) {
  try {
    await dbConnect();

    // Fetch all executives with their department assignments
    const executiveAssignments = await ExecutiveDepartments.find({}).lean();
    
    // Get all executives' full details
    const executives = await FormData.find({ 
      isExecutive: true,
      status: 'approved' 
    }).select('username basicDetails title department contactInformation profileImage').lean();

    // Get all department heads
    const deptHeads = await FormData.find({ 
      isDeptHead: true,
      status: 'approved' 
    }).select('username basicDetails title department contactInformation profileImage').lean();

    // Get all departments
    const allDepartments = await FormData.distinct('department', { status: 'approved' });

    // Get employee counts per department
    const departmentStats = await Promise.all(
      allDepartments.map(async (dept) => {
        const totalEmployees = await FormData.countDocuments({ 
          department: dept, 
          status: 'approved' 
        });
        
        const deptHeadCount = await FormData.countDocuments({ 
          department: dept, 
          isDeptHead: true,
          status: 'approved' 
        });

        const regularEmployees = totalEmployees - deptHeadCount;

        return {
          department: dept,
          totalEmployees,
          deptHeadCount,
          regularEmployees
        };
      })
    );

    // Build organization structure
    const orgStructure = {
      executives: executives.map(exec => {
        const assignment = executiveAssignments.find(a => a.username === exec.username);
        return {
          id: exec._id?.toString(),
          username: exec.username,
          name: exec.basicDetails?.name || exec.username,
          title: exec.title,
          department: exec.department,
          profileImage: exec.basicDetails?.profileImage || '/default-profile.jpg',
          email: exec.contactInformation?.email,
          managedDepartments: assignment?.departments || []
        };
      }),
      
      departments: allDepartments.map(dept => {
        const stats = departmentStats.find(s => s.department === dept);
        const heads = deptHeads.filter(h => h.department === dept);
        
        // Find executives managing this department
        const managingExecs = executives.filter(exec => {
          const assignment = executiveAssignments.find(a => a.username === exec.username);
          return assignment?.departments.includes(dept);
        });

        return {
          name: dept,
          totalEmployees: stats?.totalEmployees || 0,
          regularEmployees: stats?.regularEmployees || 0,
          heads: heads.map(head => ({
            id: head._id?.toString(),
            username: head.username,
            name: head.basicDetails?.name || head.username,
            title: head.title,
            profileImage: head.basicDetails?.profileImage || '/default-profile.jpg',
            email: head.contactInformation?.email
          })),
          managingExecutives: managingExecs.map(exec => exec.username)
        };
      })
    };

    // Calculate total stats
    const totalEmployees = await FormData.countDocuments({ status: 'approved' });
    const totalExecutives = executives.length;
    const totalDeptHeads = deptHeads.length;
    const totalRegular = totalEmployees - totalExecutives - totalDeptHeads;

    return NextResponse.json({
      success: true,
      data: orgStructure,
      stats: {
        totalEmployees,
        totalExecutives,
        totalDeptHeads,
        totalRegular,
        totalDepartments: allDepartments.length
      }
    });
  } catch (error) {
    console.error('Error fetching org chart data:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch organization chart data' },
      { status: 500 }
    );
  }
}