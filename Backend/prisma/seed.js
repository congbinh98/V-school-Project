const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const { roles } = require('./seeds/roles.seed')
const { accounts } = require('./seeds/accounts.seed');

const { parents } = require('./seeds/parents.seed')
const { schools } = require('./seeds/schools.seed')
const { students } = require('./seeds/students.seed')
const { super_admin } = require('./seeds/super_admin.seed')
const { invoices_mapping } = require('./seeds/invoices_mapping.seed')
const { invoices } = require('./seeds/invoices.seed')
const { notiType } = require('./seeds/notificationType.seed')
const { merchant } = require('./seeds/merchant.seed')

async function main() {

    // create role
    await prisma.role.createMany({ data: roles });


    // // create account
    await prisma.account.createMany({ data: accounts });

    // // create parent
    await prisma.parent.createMany({ data: parents });

    // // create school
    await prisma.school.createMany({ data: schools });

    // // create student
    await prisma.student.createMany({ data: students });

    // // create super admin
    await prisma.super_admin.createMany({ data: super_admin });

    // create invoice
    await prisma.invoice.createMany({ data: invoices })

    // create invoice_mappin
    await prisma.invoice_mapping.createMany({ data: invoices_mapping })

    // create noti type
    await prisma.notificationType.createMany({ data: notiType })

    // create merchant
    await prisma.merchant_code_key.createMany({ data: merchant })
}

main().catch(e => {
    console.error(e)
    process.exit(1);
}).finally(() => {
    prisma.$disconnect();
})