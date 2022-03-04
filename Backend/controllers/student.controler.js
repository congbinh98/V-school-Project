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

// order by name
async function objSortFunction(field, sort) {
    try {
        var objSort;
        switch (field) {
            case 'bhyt':
                objSort = {
                    "BHYT": sort === 'asc' ? 'asc' : 'desc',
                }
                break;
            case 'name':
                objSort = {
                    "name": sort === 'asc' ? 'asc' : 'desc',
                }
                break;
            case 'classCode':
                objSort = {
                    "classcode": sort === 'asc' ? 'asc' : 'desc',
                }
                break;
            case 'gender':
                objSort = {
                    "gender": sort === 'asc' ? 'asc' : 'desc',
                }
                break;
            default:
                break;
        }
        return objSort;
    } catch (error) {
        console.log(error);
        return null;
    }
}

module.exports.getAllNoToken = async(req, res) => {
    try {
        var page = parseInt(req.query.page) || 1;
        var limit = parseInt(req.query.limit) || 10;
        // var search = req.query.search;
        // var sortParam = req.query.sort;
        // var fieldParam = req.query.field;
        var schoolId = parseInt(req.query.schoolId);
        var classCode = req.query.classCode;
        var name = req.query.name;
        var count = 0;
        var listStudent;
        // var sortObj;
        // sortObj = await objSortFunction(fieldParam, sortParam);

        // lay thong tin con
        listStudent = await prisma.student.findMany({
            // orderBy: {
            //     ...sortObj
            // },
            skip: (page - 1) * limit,
            take: limit,
            where: {
                schoolId: schoolId,
                classcode: classCode,
                name: name,
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
                    include: {
                        invoice: true,
                    },
                },
                parent: true,
                school: {
                    select: {
                        id: true,
                        account: {
                            select: {
                                name: true,
                            },
                        },
                    },
                },
            },
        });
        count = await prisma.student.count({
            where: {
                schoolId: schoolId,
                classcode: classCode,
                name: name,
            },
        });

        if (count === 0) {
            return res.status(400).json({ ok: false, message: "Không tìm thấy học sinh nào!" });
        }

        return res.json({ ok: true, count: count, data: listStudent, message: "Lấy thông tin học sinh thành công!" });

    } catch (error) {
        console.log(error)
        return res.status(500).json({ ok: false, message: "Something went wrong" })
    }

}

// get one
module.exports.getOne = async(req, res) => {
    try {
        var userId = req.user.id;
        var id = parseInt(req.params.id);
        var student = null;
        // neu parent logged
        if (req.user.accRole === 'PARENT') {
            const parent = await prisma.parent.findUnique({
                where: {
                    accountId: userId,
                }
            });
            student = await prisma.student.findUnique({
                where: {
                    id: id,
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
                }

            });
            if (student) {
                if (!(student.parentId === parent.id)) {
                    return res.status(400).json({
                        ok: false,
                        message: "Bạn không phải phụ huynh của học sinh này!"
                    })
                };
            };

        }
        // neu school logged
        else if (req.user.accRole === 'SCHOOL') {
            const school = await prisma.school.findUnique({
                where: {
                    accountId: userId,
                }
            })
            student = await prisma.student.findFirst({
                where: {
                    id: id,
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
                }

            });
            if (student) {
                if (!(student.schoolId === school.id)) {
                    return res.status(400).json({
                        ok: false,
                        message: "Học sinh này không thuộc trường!"
                    })
                }
            };
        }
        // neu admin logged
        else if (req.user.accRole === 'SUPERADMIN') {
            student = await prisma.student.findFirst({
                where: {
                    id: id,
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
                }
            });
        }
        if (!student) {
            return res.status(400).json({ ok: false, message: "Không tìm thấy học sinh nào!" })
        }
        return res.json({ ok: true, data: student, message: "Lấy thông tin học sinh thành công!" })
    } catch (error) {
        console.log(error)
        return res.status(500).json({ ok: false, message: "Something went wrong" })
    }
}