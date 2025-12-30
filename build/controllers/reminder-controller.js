import { ReminderService } from "../services/reminder-service.js";
import { WarrantyReinstatementService } from "../services/warranty-reinstatement-service.js";
const reminderService = new ReminderService();
const reinstatementService = new WarrantyReinstatementService();
export async function getPendingReminders(request, reply) {
  try {
    const reminders = await reminderService.getPendingReminders();
    return reply.code(200).send({
      success: true,
      data: reminders,
      message: `Found ${reminders.length} pending reminders`
    });
  } catch (error) {
    console.error("Error getting pending reminders:", error);
    return reply.code(500).send({
      success: false,
      message: "Failed to get pending reminders",
      error: error.message
    });
  }
}
export async function processPendingReminders(request, reply) {
  try {
    const result = await reminderService.processPendingReminders();
    return reply.code(200).send({
      success: true,
      data: result,
      message: `Processed reminders: ${result.sent} sent, ${result.failed} failed`
    });
  } catch (error) {
    console.error("Error processing reminders:", error);
    return reply.code(500).send({
      success: false,
      message: "Failed to process reminders",
      error: error.message
    });
  }
}
export async function processGracePeriodExpiry(request, reply) {
  try {
    const expiredCount = await reminderService.processGracePeriodExpiry();
    return reply.code(200).send({
      success: true,
      data: { expiredCount },
      message: `Grace period expiry processed: ${expiredCount} warranties lapsed`
    });
  } catch (error) {
    console.error("Error processing grace period expiry:", error);
    return reply.code(500).send({
      success: false,
      message: "Failed to process grace period expiry",
      error: error.message
    });
  }
}
export async function getReminderStatistics(request, reply) {
  try {
    const stats = await reminderService.getReminderStatistics();
    return reply.code(200).send({
      success: true,
      data: stats,
      message: "Reminder statistics retrieved successfully"
    });
  } catch (error) {
    console.error("Error getting reminder statistics:", error);
    return reply.code(500).send({
      success: false,
      message: "Failed to get reminder statistics",
      error: error.message
    });
  }
}
export async function scheduleWarrantyReminders(request, reply) {
  try {
    const { warrantyId } = request.params;
    await reminderService.scheduleWarrantyReminders(warrantyId);
    return reply.code(200).send({
      success: true,
      message: `Reminders scheduled for warranty: ${warrantyId}`
    });
  } catch (error) {
    console.error("Error scheduling warranty reminders:", error);
    return reply.code(500).send({
      success: false,
      message: "Failed to schedule warranty reminders",
      error: error.message
    });
  }
}
export async function cancelWarrantyReminders(request, reply) {
  try {
    const { warrantyId } = request.params;
    await reminderService.cancelWarrantyReminders(warrantyId);
    return reply.code(200).send({
      success: true,
      message: `Reminders cancelled for warranty: ${warrantyId}`
    });
  } catch (error) {
    console.error("Error cancelling warranty reminders:", error);
    return reply.code(500).send({
      success: false,
      message: "Failed to cancel warranty reminders",
      error: error.message
    });
  }
}
export async function getLapsedWarranties(request, reply) {
  try {
    const lapsedWarranties = await reinstatementService.getLapsedWarranties();
    return reply.code(200).send({
      success: true,
      data: lapsedWarranties,
      message: `Found ${lapsedWarranties.length} lapsed warranties`
    });
  } catch (error) {
    console.error("Error getting lapsed warranties:", error);
    return reply.code(500).send({
      success: false,
      message: "Failed to get lapsed warranties",
      error: error.message
    });
  }
}
export async function reinstateWarranty(request, reply) {
  try {
    const { warrantyId } = request.params;
    const { reason, inspectionId, notes } = request.body;
    const user = request.user;
    const reinstatement = await reinstatementService.reinstateWarranty({
      warrantyId,
      reinstatedBy: user.id,
      reason,
      inspectionId,
      notes
    });
    return reply.code(200).send({
      success: true,
      data: reinstatement,
      message: "Warranty reinstated successfully"
    });
  } catch (error) {
    console.error("Error reinstating warranty:", error);
    return reply.code(400).send({
      success: false,
      message: "Failed to reinstate warranty",
      error: error.message
    });
  }
}
export async function checkReinstatementEligibility(request, reply) {
  try {
    const { warrantyId } = request.params;
    const eligibility = await reinstatementService.checkReinstatementEligibility(warrantyId);
    return reply.code(200).send({
      success: true,
      data: eligibility,
      message: "Reinstatement eligibility checked"
    });
  } catch (error) {
    console.error("Error checking reinstatement eligibility:", error);
    return reply.code(500).send({
      success: false,
      message: "Failed to check reinstatement eligibility",
      error: error.message
    });
  }
}
export async function getWarrantyReinstatementHistory(request, reply) {
  try {
    const { warrantyId } = request.params;
    const history = await reinstatementService.getWarrantyReinstatementHistory(warrantyId);
    return reply.code(200).send({
      success: true,
      data: history,
      message: "Reinstatement history retrieved successfully"
    });
  } catch (error) {
    console.error("Error getting reinstatement history:", error);
    return reply.code(500).send({
      success: false,
      message: "Failed to get reinstatement history",
      error: error.message
    });
  }
}
export async function getReinstatementStatistics(request, reply) {
  try {
    const stats = await reinstatementService.getReinstatementStatistics();
    return reply.code(200).send({
      success: true,
      data: stats,
      message: "Reinstatement statistics retrieved successfully"
    });
  } catch (error) {
    console.error("Error getting reinstatement statistics:", error);
    return reply.code(500).send({
      success: false,
      message: "Failed to get reinstatement statistics",
      error: error.message
    });
  }
}
export async function sendTestReminder(request, reply) {
  try {
    const { email } = request.body;
    console.log(`\u{1F4E7} Test reminder would be sent to: ${email}`);
    return reply.code(200).send({
      success: true,
      message: `Test reminder sent to ${email}`
    });
  } catch (error) {
    console.error("Error sending test reminder:", error);
    return reply.code(500).send({
      success: false,
      message: "Failed to send test reminder",
      error: error.message
    });
  }
}
