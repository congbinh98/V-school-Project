const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const axios = require('axios');
require('dotenv').config();


const instance = axios.create({
    baseURL: process.env.thanhatURL

});

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
                    "classCode": sort === 'asc' ? 'asc' : 'desc',
                }
                break;
            case 'amount':
                objSort = {
                    "amount": sort === 'asc' ? 'asc' : 'desc',
                }
                break;
            default:
                break;
        }
        return objSort;
    } catch (error) {
        console.log(error);
        return null;
    } finally {
        async() =>
        await prisma.$disconnect()
    }
}