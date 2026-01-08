// ============================================
// lib/functionalityUtils.ts
// Utility functions to work with both regular and super functionalities
// ============================================

import mongoose from 'mongoose';
import SuperFunctionality from '@/models/SuperFunctionality';
import Functionality from '@/models/Functionality';

/**
 * Check if a functionality ID belongs to a super functionality
 */
export async function isSuperFunctionalityId(functionalityId: string | mongoose.Types.ObjectId): Promise<boolean> {
  try {
    const id = typeof functionalityId === 'string' 
      ? new mongoose.Types.ObjectId(functionalityId) 
      : functionalityId;
    
    const superFunc = await SuperFunctionality.findById(id).select('_id').lean();
    return !!superFunc;
  } catch (error) {
    return false;
  }
}

/**
 * Get functionality from either collection
 */
export async function getFunctionalityById(functionalityId: string | mongoose.Types.ObjectId) {
  const id = typeof functionalityId === 'string' 
    ? new mongoose.Types.ObjectId(functionalityId) 
    : functionalityId;
  
  // Try SuperFunctionality first
  let functionality = await SuperFunctionality.findById(id).lean();
  
  if (functionality) {
    return { ...functionality, isSuper: true };
  }
  
  // Fall back to regular Functionality
  functionality = await Functionality.findById(id).lean();
  
  if (functionality) {
    return { ...functionality, isSuper: false };
  }
  
  return null;
}

/**
 * Get all functionalities (both types) for display
 */
export async function getAllFunctionalities(filters?: {
  department?: string;
  createdBy?: string;
}) {
  const superFuncs = await SuperFunctionality.find(
    filters?.createdBy ? { createdBy: filters.createdBy } : {}
  ).lean();
  
  const regularFuncs = await Functionality.find(
    filters?.department ? { department: filters.department } : {}
  ).lean();
  
  return {
    super: superFuncs.map(f => ({ ...f, isSuper: true })),
    regular: regularFuncs.map(f => ({ ...f, isSuper: false })),
    all: [
      ...superFuncs.map(f => ({ ...f, isSuper: true })),
      ...regularFuncs.map(f => ({ ...f, isSuper: false }))
    ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  };
}

/**
 * Check if a user can create a ticket for a given functionality
 */
export async function canUserCreateTicket(
  functionalityId: string | mongoose.Types.ObjectId,
  userId: string,
  userDepartment: string
): Promise<{ allowed: boolean; reason?: string }> {
  const functionality = await getFunctionalityById(functionalityId);
  
  if (!functionality) {
    return { allowed: false, reason: 'Functionality not found' };
  }
  
  // Regular functionalities - check department
  if (!functionality.isSuper) {
    if (functionality.department === userDepartment) {
      return { allowed: true };
    }
    return { allowed: false, reason: 'Only members of the ' + functionality.department + ' department can create tickets' };
  }
  
  // Super functionalities - check access control
  const accessControl = functionality.accessControl;
  
  switch (accessControl.type) {
    case 'all':
      return { allowed: true };
    
    case 'department':
      if (accessControl.departments.includes(userDepartment)) {
        return { allowed: true };
      }
      return { 
        allowed: false, 
        reason: 'Only members of specific departments can create tickets for this workflow' 
      };
    
    case 'specific':
      if (accessControl.employees.includes(userId)) {
        return { allowed: true };
      }
      return { 
        allowed: false, 
        reason: 'Only specific employees can create tickets for this workflow' 
      };
    
    default:
      return { allowed: false, reason: 'Invalid access control configuration' };
  }
}

/**
 * Get available functionalities for a user
 */
export async function getAvailableFunctionalitiesForUser(
  userId: string,
  userDepartment: string
) {
  // Get all regular functionalities for user's department
  const regularFuncs = await Functionality.find({ department: userDepartment }).lean();
  
  // Get all super functionalities
  const allSuperFuncs = await SuperFunctionality.find().lean();
  
  // Filter super functionalities based on access control
  const availableSuperFuncs = allSuperFuncs.filter(func => {
    switch (func.accessControl.type) {
      case 'all':
        return true;
      case 'department':
        return func.accessControl.departments.includes(userDepartment);
      case 'specific':
        return func.accessControl.employees.includes(userId);
      default:
        return false;
    }
  });
  
  return {
    regular: regularFuncs.map(f => ({ ...f, isSuper: false })),
    super: availableSuperFuncs.map(f => ({ ...f, isSuper: true })),
    all: [
      ...regularFuncs.map(f => ({ ...f, isSuper: false })),
      ...availableSuperFuncs.map(f => ({ ...f, isSuper: true }))
    ].sort((a, b) => a.name.localeCompare(b.name))
  };
}