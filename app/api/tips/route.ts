import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { handleError, ok } from "@/lib/api";

const hoursMap = z.record(z.string(), z.number().min(0).max(24));

const schema = z.object({
  weekStart: z.string().length(10),
  weekEnd: z.string().length(10),
  hourlyRate: z.number().min(0).max(1000),
  preparedBy: z.string().min(1).max(120),
  employees: z
    .array(
      z.object({
        userId: z.string(),
        hours: hoursMap,
      }),
    )
    .min(0),
  dailyTips: z.record(z.string(), z.number().min(0)),
});

export async function POST(req: Request) {
  try {
    const admin = await requireAdmin();
    const body = schema.parse(await req.json());

    const weekStart = new Date(body.weekStart + "T00:00:00Z");
    const weekEnd = new Date(body.weekEnd + "T00:00:00Z");

    const report = await prisma.$transaction(async (tx) => {
      const existing = await tx.tipReport.findUnique({
        where: { weekStart },
      });

      let reportRecord;
      if (existing) {
        reportRecord = await tx.tipReport.update({
          where: { id: existing.id },
          data: {
            weekEnd,
            hourlyRate: body.hourlyRate,
            preparedBy: body.preparedBy || admin.fullName,
          },
        });
        await tx.dailyTip.deleteMany({ where: { reportId: existing.id } });
        await tx.hoursEntry.deleteMany({ where: { reportId: existing.id } });
      } else {
        reportRecord = await tx.tipReport.create({
          data: {
            weekStart,
            weekEnd,
            hourlyRate: body.hourlyRate,
            preparedBy: body.preparedBy || admin.fullName,
          },
        });
      }

      const dailyTipsData = Object.entries(body.dailyTips).map(([date, tot]) => ({
        reportId: reportRecord.id,
        date: new Date(date + "T00:00:00Z"),
        totalTip: tot,
      }));
      if (dailyTipsData.length > 0) {
        await tx.dailyTip.createMany({ data: dailyTipsData });
      }

      const hoursData = body.employees.flatMap((emp) =>
        Object.entries(emp.hours).map(([date, hours]) => ({
          reportId: reportRecord.id,
          userId: emp.userId,
          date: new Date(date + "T00:00:00Z"),
          hours,
        })),
      );
      if (hoursData.length > 0) {
        await tx.hoursEntry.createMany({ data: hoursData });
      }

      return reportRecord;
    });

    return ok({ id: report.id });
  } catch (err) {
    return handleError(err);
  }
}
