import { PrismaClient, Position, Role } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const adminUsername = process.env.SEED_ADMIN_USERNAME ?? "admin";
  const adminPassword = process.env.SEED_ADMIN_PASSWORD ?? "ChangeMe123!";
  const adminName = process.env.SEED_ADMIN_NAME ?? "Administrador";

  const passwordHash = await bcrypt.hash(adminPassword, 12);

  const admin = await prisma.user.upsert({
    where: { username: adminUsername },
    update: {},
    create: {
      username: adminUsername,
      passwordHash,
      fullName: adminName,
      role: Role.ADMIN,
      position: Position.SUPERVISOR,
      vacationHours: 120,
      sickHours: 80,
    },
  });

  const demoEmployees = [
    "Yadriel Rodriguez",
    "Paola Laureano",
    "Armando Meléndez",
    "Brian Larroy",
    "Bryan Loran",
    "Yandeliz Feliciano",
    "Josue Colón",
  ];

  for (const fullName of demoEmployees) {
    const username = fullName
      .toLowerCase()
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .replace(/[^a-z]+/g, ".")
      .replace(/^\.|\.$/g, "");

    const hash = await bcrypt.hash("Empleado123!", 12);

    await prisma.user.upsert({
      where: { username },
      update: {},
      create: {
        username,
        passwordHash: hash,
        fullName,
        role: Role.EMPLOYEE,
        position: Position.SLOT_ATTENDANT,
        hourlyRate: 11.33,
        vacationHours: 10,
        sickHours: 8,
      },
    });
  }

  // eslint-disable-next-line no-console
  console.log(`Seed complete. Admin user: ${admin.username}`);
}

main()
  .catch((e) => {
    // eslint-disable-next-line no-console
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
