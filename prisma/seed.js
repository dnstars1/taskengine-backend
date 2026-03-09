const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function main() {
  // Clean existing data
  await prisma.studySession.deleteMany();
  await prisma.assignment.deleteMany();
  await prisma.course.deleteMany();
  await prisma.user.deleteMany();

  // Create demo user
  const passwordHash = await bcrypt.hash('password123', 10);
  const user = await prisma.user.create({
    data: {
      name: 'Alex Student',
      email: 'alex@university.edu',
      passwordHash,
      notificationsEnabled: true,
      darkModeEnabled: false,
    },
  });

  // Create courses matching Flutter mock data
  const courses = await Promise.all([
    prisma.course.create({ data: { name: 'Mobile Development', userId: user.id } }),
    prisma.course.create({ data: { name: 'Data Structures', userId: user.id } }),
    prisma.course.create({ data: { name: 'Machine Learning', userId: user.id } }),
    prisma.course.create({ data: { name: 'Web Technologies', userId: user.id } }),
  ]);

  const [mobileDev, dataStructures, machineLearning, webTech] = courses;

  // Create assignments with upcoming due dates (relative to now)
  const now = new Date();
  const daysFromNow = (d) => new Date(now.getTime() + d * 24 * 60 * 60 * 1000);

  await Promise.all([
    prisma.assignment.create({
      data: {
        title: 'Flutter UI Prototype',
        courseId: mobileDev.id,
        userId: user.id,
        dueDate: daysFromNow(3),
        weight: 25,
        difficulty: 4,
        priority: 0,
        source: 'manual',
      },
    }),
    prisma.assignment.create({
      data: {
        title: 'Binary Tree Implementation',
        courseId: dataStructures.id,
        userId: user.id,
        dueDate: daysFromNow(5),
        weight: 15,
        difficulty: 3,
        priority: 0,
        source: 'manual',
      },
    }),
    prisma.assignment.create({
      data: {
        title: 'Neural Network Report',
        courseId: machineLearning.id,
        userId: user.id,
        dueDate: daysFromNow(7),
        weight: 30,
        difficulty: 5,
        priority: 0,
        source: 'manual',
      },
    }),
    prisma.assignment.create({
      data: {
        title: 'REST API Project',
        courseId: webTech.id,
        userId: user.id,
        dueDate: daysFromNow(10),
        weight: 20,
        difficulty: 3,
        priority: 0,
        source: 'manual',
      },
    }),
    prisma.assignment.create({
      data: {
        title: 'Algorithm Analysis Essay',
        courseId: dataStructures.id,
        userId: user.id,
        dueDate: daysFromNow(14),
        weight: 10,
        difficulty: 2,
        priority: 0,
        source: 'manual',
      },
    }),
  ]);

  // Create study sessions for the past week
  const daysAgo = (d) => new Date(now.getTime() - d * 24 * 60 * 60 * 1000);

  await Promise.all([
    prisma.studySession.create({ data: { userId: user.id, courseId: mobileDev.id, duration: 90, date: daysAgo(1) } }),
    prisma.studySession.create({ data: { userId: user.id, courseId: dataStructures.id, duration: 60, date: daysAgo(1) } }),
    prisma.studySession.create({ data: { userId: user.id, courseId: machineLearning.id, duration: 120, date: daysAgo(2) } }),
    prisma.studySession.create({ data: { userId: user.id, courseId: webTech.id, duration: 45, date: daysAgo(3) } }),
    prisma.studySession.create({ data: { userId: user.id, courseId: mobileDev.id, duration: 75, date: daysAgo(4) } }),
    prisma.studySession.create({ data: { userId: user.id, courseId: dataStructures.id, duration: 50, date: daysAgo(5) } }),
    prisma.studySession.create({ data: { userId: user.id, courseId: machineLearning.id, duration: 100, date: daysAgo(6) } }),
  ]);

  console.log('Seed complete: 1 user, 4 courses, 5 assignments, 7 study sessions');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
