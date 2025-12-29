import { FastifyRequest, FastifyReply } from 'fastify';
import { User } from '../entities/User.js';
import { Warranty } from '../entities/Warranty.js';
import { AnnualInspection } from '../entities/AnnualInspection.js';
import { PartnerAccount } from '../entities/PartnerAccount.js';
import Response from '../Traits/ApiResponser.js';

/**
 * 📊 Get Dashboard Statistics
 */
export const getDashboardStats = async (req: FastifyRequest, reply: FastifyReply) => {
  try {
    const currentUser = (req as any).user;
    
    // Get repositories
    const warrantyRepo = req.server.db.getRepository(Warranty);
    const inspectionRepo = req.server.db.getRepository(AnnualInspection);
    const userRepo = req.server.db.getRepository(User);
    const partnerAccountRepo = req.server.db.getRepository(PartnerAccount);

    // Base query conditions based on user role
    let warrantyConditions: any = { isDeleted: false };
    let inspectionConditions: any = { isDeleted: false };
    let userConditions: any = { isDeleted: false, role: 'PARTNER_USER' };

    // Apply partner account filtering for non-admin users
    if (currentUser.role !== 'ERPS_ADMIN' && currentUser.partnerAccountId) {
      warrantyConditions.partnerAccountId = currentUser.partnerAccountId;
      inspectionConditions.partnerAccountId = currentUser.partnerAccountId;
      userConditions.partnerAccountId = currentUser.partnerAccountId;
    }

    // 1. Last 10 Warranties Added
    const lastWarranties = await warrantyRepo.find({
      where: warrantyConditions,
      order: { created: 'DESC' },
      take: 10,
      select: [
        'id', 'firstName', 'lastName', 'make', 'model', 'vinNumber',
        'installersName', 'dateInstalled', 'verificationStatus', 'status',
        'corrosionFound', 'created'
      ]
    });

    // 2. Warranties with Existing Corrosion
    const corrosionWarranties = await warrantyRepo.find({
      where: { ...warrantyConditions, corrosionFound: true },
      order: { created: 'DESC' },
      take: 20,
      select: [
        'id', 'firstName', 'lastName', 'make', 'model', 'vinNumber',
        'installersName', 'dateInstalled', 'corrosionDetails', 'created'
      ]
    });

    // 3. Last 10 Inspections Completed
    const lastInspections = await inspectionRepo.find({
      where: { ...inspectionConditions, verificationStatus: 'VERIFIED' },
      order: { verifiedAt: 'DESC' },
      take: 10,
      select: [
        'id', 'warrantyId', 'inspectionDate', 'corrosionFound',
        'verificationStatus', 'verifiedAt', 'warrantyExtendedUntil'
      ]
    });

    // Get warranty details for inspections
    const inspectionWarrantyIds = lastInspections.map(inspection => inspection.warrantyId);
    let inspectionWarranties: any[] = [];
    
    if (inspectionWarrantyIds.length > 0) {
      inspectionWarranties = await warrantyRepo.findByIds(inspectionWarrantyIds, {
        select: ['id', 'firstName', 'lastName', 'make', 'model', 'vinNumber']
      });
    }

    // Map warranty details to inspections
    const inspectionsWithWarrantyDetails = lastInspections.map(inspection => {
      const warranty = inspectionWarranties.find(w => w.id === inspection.warrantyId);
      return {
        ...inspection,
        warranty: warranty ? {
          ownerName: `${warranty.firstName} ${warranty.lastName}`,
          vehicle: `${warranty.make} ${warranty.model}`,
          vinNumber: warranty.vinNumber
        } : null
      };
    });

    // 4. Top 10 Partner Account Staff (simplified query)
    let topAccountStaff: any[] = [];
    
    try {
      const staffUsers = await userRepo.find({
        where: {
          isDeleted: false,
          role: 'PARTNER_USER',
          partnerRole: 'ACCOUNT_STAFF',
          ...(currentUser.role !== 'ERPS_ADMIN' && currentUser.partnerAccountId ? 
            { partnerAccountId: currentUser.partnerAccountId } : {})
        },
        select: ['id', 'fullName', 'email', 'partnerAccountId'],
        take: 20
      });

      // Get warranty counts for each staff member
      for (const staff of staffUsers) {
        const warrantyCount = await warrantyRepo.count({
          where: { agentId: staff.id, isDeleted: false }
        });
        
        // Get partner account info
        let partnerBusinessName = 'N/A';
        if (staff.partnerAccountId) {
          const partnerAccount = await partnerAccountRepo.findOne({
            where: { id: staff.partnerAccountId },
            select: ['businessName']
          });
          partnerBusinessName = partnerAccount?.businessName || 'N/A';
        }

        topAccountStaff.push({
          id: staff.id,
          fullName: staff.fullName || 'N/A',
          email: staff.email,
          partnerBusinessName,
          warrantyCount
        });
      }

      // Sort by warranty count and take top 10
      topAccountStaff = topAccountStaff
        .sort((a, b) => b.warrantyCount - a.warrantyCount)
        .slice(0, 10);
    } catch (error) {
      console.error('Error fetching top account staff:', error);
      topAccountStaff = [];
    }

    // 5. Top 10 Account Installers (simplified query)
    let topInstallers: any[] = [];
    
    try {
      const installerUsers = await userRepo.find({
        where: {
          isDeleted: false,
          role: 'PARTNER_USER',
          partnerRole: 'ACCOUNT_INSTALLER',
          ...(currentUser.role !== 'ERPS_ADMIN' && currentUser.partnerAccountId ? 
            { partnerAccountId: currentUser.partnerAccountId } : {})
        },
        select: ['id', 'fullName', 'email', 'mobileNumber', 'isAccreditedInstaller', 'isAuthorisedInspector', 'partnerAccountId'],
        take: 20
      });

      // Get installation and inspection counts for each installer
      for (const installer of installerUsers) {
        const installationCount = await warrantyRepo.count({
          where: { installerId: installer.id, isDeleted: false }
        });
        
        const inspectionCount = await inspectionRepo.count({
          where: { inspectorId: installer.id, isDeleted: false }
        });
        
        // Get partner account info
        let partnerBusinessName = 'N/A';
        if (installer.partnerAccountId) {
          const partnerAccount = await partnerAccountRepo.findOne({
            where: { id: installer.partnerAccountId },
            select: ['businessName']
          });
          partnerBusinessName = partnerAccount?.businessName || 'N/A';
        }

        topInstallers.push({
          id: installer.id,
          fullName: installer.fullName || 'N/A',
          email: installer.email,
          mobileNumber: installer.mobileNumber || null,
          isAccreditedInstaller: installer.isAccreditedInstaller,
          isAuthorisedInspector: installer.isAuthorisedInspector,
          partnerBusinessName,
          installationCount,
          inspectionCount,
          totalWork: installationCount + inspectionCount
        });
      }

      // Sort by total work and take top 10
      topInstallers = topInstallers
        .sort((a, b) => b.totalWork - a.totalWork)
        .slice(0, 10);
    } catch (error) {
      console.error('Error fetching top installers:', error);
      topInstallers = [];
    }

    // Summary statistics
    const totalWarranties = await warrantyRepo.count({ where: warrantyConditions });
    const totalInspections = await inspectionRepo.count({ where: inspectionConditions });
    const totalCorrosionCases = await warrantyRepo.count({ 
      where: { ...warrantyConditions, corrosionFound: true } 
    });
    const pendingVerifications = await warrantyRepo.count({ 
      where: { ...warrantyConditions, verificationStatus: 'SUBMITTED' } 
    }) + await inspectionRepo.count({ 
      where: { ...inspectionConditions, verificationStatus: 'SUBMITTED' } 
    });

    return Response.showOne(reply, {
      success: true,
      message: 'Dashboard statistics retrieved successfully',
      data: {
        summary: {
          totalWarranties,
          totalInspections,
          totalCorrosionCases,
          pendingVerifications
        },
        lastWarranties: lastWarranties.map(warranty => ({
          id: warranty.id,
          ownerName: `${warranty.firstName} ${warranty.lastName}`,
          vehicle: `${warranty.make} ${warranty.model}`,
          vinNumber: warranty.vinNumber,
          installerName: warranty.installersName,
          dateInstalled: warranty.dateInstalled,
          verificationStatus: warranty.verificationStatus,
          status: warranty.status,
          corrosionFound: warranty.corrosionFound,
          created: warranty.created
        })),
        corrosionWarranties: corrosionWarranties.map(warranty => ({
          id: warranty.id,
          ownerName: `${warranty.firstName} ${warranty.lastName}`,
          vehicle: `${warranty.make} ${warranty.model}`,
          vinNumber: warranty.vinNumber,
          installerName: warranty.installersName,
          dateInstalled: warranty.dateInstalled,
          corrosionDetails: warranty.corrosionDetails,
          created: warranty.created
        })),
        lastInspections: inspectionsWithWarrantyDetails,
        topAccountStaff,
        topInstallers
      }
    });

  } catch (err: any) {
    console.error('❌ getDashboardStats error:', err);
    return Response.errorResponse(reply, err.message || 'Failed to retrieve dashboard statistics');
  }
};

/**
 * 📊 Get Dashboard Summary (Quick Stats)
 */
export const getDashboardSummary = async (req: FastifyRequest, reply: FastifyReply) => {
  try {
    const currentUser = (req as any).user;
    
    // Get repositories
    const warrantyRepo = req.server.db.getRepository(Warranty);
    const inspectionRepo = req.server.db.getRepository(AnnualInspection);
    const userRepo = req.server.db.getRepository(User);
    const partnerAccountRepo = req.server.db.getRepository(PartnerAccount);

    // Base query conditions
    let warrantyConditions: any = { isDeleted: false };
    let inspectionConditions: any = { isDeleted: false };
    let userConditions: any = { isDeleted: false, role: 'PARTNER_USER' };

    // Apply partner account filtering for non-admin users
    if (currentUser.role !== 'ERPS_ADMIN' && currentUser.partnerAccountId) {
      warrantyConditions.partnerAccountId = currentUser.partnerAccountId;
      inspectionConditions.partnerAccountId = currentUser.partnerAccountId;
      userConditions.partnerAccountId = currentUser.partnerAccountId;
    }

    // Get counts
    const [
      totalWarranties,
      activeWarranties,
      totalInspections,
      completedInspections,
      totalCorrosionCases,
      pendingWarrantyVerifications,
      pendingInspectionVerifications,
      totalPartnerUsers,
      totalInstallers,
      totalPartnerAccounts
    ] = await Promise.all([
      warrantyRepo.count({ where: warrantyConditions }),
      warrantyRepo.count({ where: { ...warrantyConditions, status: 'ACTIVE' } }),
      inspectionRepo.count({ where: inspectionConditions }),
      inspectionRepo.count({ where: { ...inspectionConditions, verificationStatus: 'VERIFIED' } }),
      warrantyRepo.count({ where: { ...warrantyConditions, corrosionFound: true } }),
      warrantyRepo.count({ where: { ...warrantyConditions, verificationStatus: 'SUBMITTED' } }),
      inspectionRepo.count({ where: { ...inspectionConditions, verificationStatus: 'SUBMITTED' } }),
      userRepo.count({ where: userConditions }),
      userRepo.count({ where: { ...userConditions, partnerRole: 'ACCOUNT_INSTALLER' } }),
      currentUser.role === 'ERPS_ADMIN' ? 
        partnerAccountRepo.count({ where: { isDeleted: false } }) : 1
    ]);

    return Response.showOne(reply, {
      success: true,
      message: 'Dashboard summary retrieved successfully',
      data: {
        warranties: {
          total: totalWarranties,
          active: activeWarranties,
          withCorrosion: totalCorrosionCases,
          pendingVerification: pendingWarrantyVerifications
        },
        inspections: {
          total: totalInspections,
          completed: completedInspections,
          pendingVerification: pendingInspectionVerifications
        },
        users: {
          totalPartnerUsers,
          totalInstallers
        },
        partnerAccounts: totalPartnerAccounts,
        pendingVerifications: pendingWarrantyVerifications + pendingInspectionVerifications
      }
    });

  } catch (err: any) {
    console.error('❌ getDashboardSummary error:', err);
    return Response.errorResponse(reply, err.message || 'Failed to retrieve dashboard summary');
  }
};

/**
 * 📊 Get Recent Activity
 */
export const getRecentActivity = async (req: FastifyRequest, reply: FastifyReply) => {
  try {
    const currentUser = (req as any).user;
    const { limit = 20 } = req.query as any;
    
    // Get repositories
    const warrantyRepo = req.server.db.getRepository(Warranty);
    const inspectionRepo = req.server.db.getRepository(AnnualInspection);

    // Base query conditions
    let warrantyConditions: any = { isDeleted: false };
    let inspectionConditions: any = { isDeleted: false };

    // Apply partner account filtering for non-admin users
    if (currentUser.role !== 'ERPS_ADMIN' && currentUser.partnerAccountId) {
      warrantyConditions.partnerAccountId = currentUser.partnerAccountId;
      inspectionConditions.partnerAccountId = currentUser.partnerAccountId;
    }

    // Get recent warranties
    const recentWarranties = await warrantyRepo.find({
      where: warrantyConditions,
      order: { modified: 'DESC' },
      take: Math.min(limit, 50),
      select: [
        'id', 'firstName', 'lastName', 'make', 'model', 'vinNumber',
        'verificationStatus', 'status', 'created', 'modified'
      ]
    });

    // Get recent inspections
    const recentInspections = await inspectionRepo.find({
      where: inspectionConditions,
      order: { modified: 'DESC' },
      take: Math.min(limit, 50),
      select: [
        'id', 'warrantyId', 'inspectionDate', 'verificationStatus',
        'corrosionFound', 'created', 'modified'
      ]
    });

    // Combine and sort by modification date
    const activities = [
      ...recentWarranties.map(warranty => ({
        type: 'WARRANTY',
        id: warranty.id,
        title: `${warranty.firstName} ${warranty.lastName} - ${warranty.make} ${warranty.model}`,
        subtitle: `VIN: ${warranty.vinNumber}`,
        status: warranty.verificationStatus,
        created: warranty.created,
        modified: warranty.modified
      })),
      ...recentInspections.map(inspection => ({
        type: 'INSPECTION',
        id: inspection.id,
        title: `Annual Inspection`,
        subtitle: `Warranty ID: ${inspection.warrantyId}`,
        status: inspection.verificationStatus,
        corrosionFound: inspection.corrosionFound,
        created: inspection.created,
        modified: inspection.modified
      }))
    ].sort((a, b) => new Date(b.modified).getTime() - new Date(a.modified).getTime())
     .slice(0, limit);

    return Response.showOne(reply, {
      success: true,
      message: 'Recent activity retrieved successfully',
      data: {
        activities,
        total: activities.length
      }
    });

  } catch (err: any) {
    console.error('❌ getRecentActivity error:', err);
    return Response.errorResponse(reply, err.message || 'Failed to retrieve recent activity');
  }
};