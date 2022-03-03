const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { isSchool, isParent } = require('../middlewares/userAuth.middleware')
const reader = require('xlsx')
const axios = require('axios');
require('dotenv').config();


const instance = axios.create({
    baseURL: process.env.thanhatURL

});

//get all by phone
module.exports.getAllByToken = async (req, res) => {
    try {
        var page = parseInt(req.query.page) || 1;
        var limit = parseInt(req.query.limit) || 10;
        var search = req.query.search;
        var sortParam = req.query.sort;
        var fieldParam = req.query.field;
        var count = 0;
        var userId = req.user.id;
        var listStudent;
        var sortObj;
        sortObj = await objSortFunction(fieldParam, sortParam);

        // neu parent logged
        if (req.user.accRole === 'PARENT') {
            const parent = await prisma.parent.findUnique({
                where: {
                    accountId: userId,
                }
            });
            parentPhone = parent.phone;

            // lay thong tin con
            listStudent = await prisma.student.findMany({
                orderBy: {
                    ...sortObj
                },
                skip: (page - 1) * limit,
                take: limit,
                where: {
                    parentId: parent.id,
                    OR: [{
                        BHYT: {
                            contains: search,
                        },
                    },
                    {
                        name: {
                            contains: search,
                        },
                    },
                    {
                        classcode: {
                            contains: search,
                        },
                    },
                    ],
                },
                include: {
                    invoice_mapping: {
                        where: {
                          OR: [{
                              billId: null,
                          },
                          {
                                billId: '',
                          },
                          {
                            bill: {
                              status: 'pending'
                            },
                          },
                          {
                            bill: {
                              status: 'cancel'
                            },
                          },
                          ],
                    },
                    },
                    parent: true,
                    school: true,
                },
            });
            count = await prisma.student.count({
                where: {
                    parentId: parent.id,
                    OR: [{
                        BHYT: {
                            contains: search,
                        },
                    },
                    {
                        name: {
                            contains: search,
                        },
                    },
                    {
                        classcode: {
                            contains: search,
                        },
                    },
                    ],
                },
            });

        }
        // neu school logged
        else if (req.user.accRole === 'SCHOOL') {
            const school = await prisma.school.findUnique({
                where: {
                    accountId: userId,
                },
            });

            listStudent = await prisma.student.findMany({
                orderBy: {
                    ...sortObj
                },
                skip: (page - 1) * limit,
                take: limit,
                where: {
                    schoolId: school.id,
                    OR: [{
                        BHYT: {
                            contains: search,
                        },
                    },
                    {
                        name: {
                            contains: search,
                        },
                    },
                    {
                        classcode: {
                            contains: search,
                        },
                    },
                    ],
                },
                include: {
                    invoice_mapping: {
                        where: {
                            OR: [{
                                billId: null,
                            },
                            {
                                billId: '',
                            },
                            {
                              bill: {
                                status: 'pending'
                              },
                            },
                            {
                              bill: {
                                status: 'cancel'
                              },
                            },
                            ],
                        },
                    },
                    parent: true,
                    school: true,
                },
            });
            count = await prisma.student.count({
                where: {
                    schoolId: school.id,
                    OR: [{
                        BHYT: {
                            contains: search,
                        },
                    },
                    {
                        name: {
                            contains: search,
                        },
                    },
                    {
                        classcode: {
                            contains: search,
                        },
                    },
                    ],
                },
            });
        }
        // neu admin logged
        else if (req.user.accRole === 'SUPERADMIN') {
            listStudent = await prisma.student.findMany({
                orderBy: {
                    ...sortObj
                },
                skip: (page - 1) * limit,
                take: limit,
                where: {
                    OR: [{
                        BHYT: {
                            contains: search,
                        },
                    },
                    {
                        name: {
                            contains: search,
                        },
                    },
                    {
                        classcode: {
                            contains: search,
                        },
                    },
                    ],
                },
                include: {
                    invoice_mapping: {
                      where: {
                        OR: [{
                            billId: null,
                        },
                        {
                            billId: '',
                        },
                        {
                          bill: {
                            status: 'pending'
                          },
                        },
                        {
                          bill: {
                            status: 'cancel'
                          },
                        },
                        ],
                    },

                    },
                    parent: true,
                    school: true,
                },
            });
            count = await prisma.student.count({
                skip: (page - 1) * limit,
                take: limit,
                where: {
                    OR: [{
                        BHYT: {
                            contains: search,
                        },
                    },
                    {
                        name: {
                            contains: search,
                        },
                    },
                    {
                        classcode: {
                            contains: search,
                        },
                    },
                    ],
                },
            });
        }
        if (count === 0) {
            return res.status(400).json({ ok: false, message: "Không tìm thấy học sinh nào!" });
        }

        return res.json({ ok: true, count: count, data: listStudent, message: "Lấy thông tin học sinh thành công!" });

    } catch (error) {
        console.log(error)
        return res.status(500).json({ ok: false, message: "Something went wrong" })
    }

}
