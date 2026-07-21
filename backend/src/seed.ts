import { clearSeedContext } from "./seed-context";
import { userRepository } from "./repositories/user.repository";
import { studentRepository } from "./repositories/student.repository";
import { classRepository } from "./repositories/class.repository";
import { attendanceRepository } from "./repositories/attendance.repository";
import { homeworkRepository } from "./repositories/homework.repository";
import { examRepository } from "./repositories/exam.repository";
import { feeRepository } from "./repositories/fee.repository";
import { announcementRepository } from "./repositories/announcement.repository";
import { communicationRepository } from "./repositories/communication.repository";
import { calendarRepository } from "./repositories/calendar.repository";

export async function seedDemoData(): Promise<void> {
  clearSeedContext();
  await userRepository.seed();
  await classRepository.seed();
  await studentRepository.seed();
  await attendanceRepository.seed();
  await homeworkRepository.seed();
  await examRepository.seed();
  await feeRepository.seed();
  await announcementRepository.seed();
  await communicationRepository.seed();
  await calendarRepository.seed();
}
