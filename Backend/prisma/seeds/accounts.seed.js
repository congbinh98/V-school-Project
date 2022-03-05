require('dotenv').config();

module.exports.accounts = [{
        id: '000',
        name: 'admin',
        email: 'vschool2021vn@gmail.com',
        password: process.env.COMMONPASSWORD,
        age: 0,
        address: 'DN',
        status: 'ACTIVE',
        accRole: 'SUPERADMIN'

    },
    // account thanhat
    {
        id: '999',
        name: 'SPAYMENT',
        email: 'null',
        password: '1234567890',
        age: 0,
        address: 'DN',
        status: 'ACTIVE',
        accRole: 'SCHOOL'

    },
    {
        id: '00002',
        name: 'Trường Mầm non Bạch Yến - Sơn Trà',
        email: 'bachyen@gmail.com',
        password: process.env.COMMONPASSWORD,
        age: 0,
        address: '35 Tô Hiến Thành, Phước Mỹ, Sơn Trà',
        status: 'ACTIVE',
        accRole: 'SCHOOL'

    }, {
        id: '00001',
        name: 'Nguyễn Văn Lâm',
        email: 'lam@gmail.com',
        password: process.env.COMMONPASSWORD,
        age: 30,
        address: 'Lý Văn Phức, Đà Nẵng',
        status: 'ACTIVE',
        accRole: 'PARENT'

    },
    {
        id: '00003',
        name: 'Trường VINTECH',
        email: 'vintech@gmail.com',
        password: process.env.COMMONPASSWORD,
        age: 0,
        address: '35 Tô Hiến Thành, Phước Mỹ, Sơn Trà',
        status: 'ACTIVE',
        accRole: 'SCHOOL'

    },
    {
        id: '00004',
        name: 'PHỤ huynh test4',
        email: 'test@gmail.com',
        password: process.env.COMMONPASSWORD,
        age: 0,
        address: '35 Tô Hiến Thành, Phước Mỹ, Sơn Trà',
        status: 'ACTIVE',
        accRole: 'PARENT'

    },
    {
        id: '00005',
        name: 'PHỤ huynh test5',
        email: 'test5@gmail.com',
        password: process.env.COMMONPASSWORD,
        age: 0,
        address: '35 Tô Hiến Thành, Phước Mỹ, Sơn Trà',
        status: 'ACTIVE',
        accRole: 'PARENT'

    },
    {
        id: '00006',
        name: 'PHỤ huynh test6',
        email: 'test6@gmail.com',
        password: process.env.COMMONPASSWORD,
        age: 0,
        address: '35 Tô Hiến Thành, Phước Mỹ, Sơn Trà',
        status: 'ACTIVE',
        accRole: 'PARENT'

    },
    {
        id: '00007',
        name: 'PHỤ huynh test7',
        email: 'test7@gmail.com',
        password: process.env.COMMONPASSWORD,
        age: 0,
        address: '35 Tô Hiến Thành, Phước Mỹ, Sơn Trà',
        status: 'ACTIVE',
        accRole: 'PARENT'

    }
]