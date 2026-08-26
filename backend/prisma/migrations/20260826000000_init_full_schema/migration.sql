-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'MANAGER', 'STAFF');

-- CreateEnum
CREATE TYPE "OltBrand" AS ENUM ('BDCOM', 'ECOM', 'VSOL', 'HUAWEI', 'GENERIC');

-- CreateEnum
CREATE TYPE "PonType" AS ENUM ('EPON', 'GPON');

-- CreateEnum
CREATE TYPE "CliProtocol" AS ENUM ('TELNET', 'SSH');

-- CreateEnum
CREATE TYPE "OnuStatus" AS ENUM ('ONLINE', 'OFFLINE', 'LOS', 'DYING_GASP', 'UNREGISTERED');

-- CreateTable
CREATE TABLE "User" (
    "id" SERIAL NOT NULL,
    "username" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'STAFF',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Customer" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "address" TEXT,
    "area" TEXT,
    "pppoeUsername" TEXT NOT NULL,
    "pppoePassword" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "packageId" INTEGER NOT NULL,
    "routerId" INTEGER,
    "oltId" INTEGER,
    "opticalPower" DOUBLE PRECISION,
    "fiberSplitter" TEXT,
    "fiberCore" TEXT,
    "collectionNote" TEXT,
    "promisedPayDate" TIMESTAMP(3),
    "notesUpdatedAt" TIMESTAMP(3),
    "joinDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expireDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Customer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Package" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "speed" TEXT NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "validity" INTEGER NOT NULL,

    CONSTRAINT "Package_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Invoice" (
    "id" SERIAL NOT NULL,
    "customerId" INTEGER NOT NULL,
    "month" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "discount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "vat" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "total" DOUBLE PRECISION NOT NULL,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'UNPAID',
    "publicToken" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Invoice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Payment" (
    "id" SERIAL NOT NULL,
    "invoiceId" INTEGER NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "method" TEXT NOT NULL,
    "receivedBy" INTEGER,
    "trxId" TEXT,
    "gatewayPaymentId" TEXT,
    "gatewayStatus" TEXT,
    "gatewayCustomerPhone" TEXT,
    "notes" TEXT,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Router" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "ipAddress" TEXT NOT NULL,
    "apiPort" INTEGER NOT NULL DEFAULT 8728,
    "username" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Router_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "action" TEXT NOT NULL,
    "details" TEXT,
    "ipAddress" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Staff" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "phone" TEXT,
    "address" TEXT,
    "joinDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "salary" DOUBLE PRECISION,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Staff_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Income" (
    "id" SERIAL NOT NULL,
    "category" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "description" TEXT,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "recordedBy" INTEGER NOT NULL,

    CONSTRAINT "Income_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Expense" (
    "id" SERIAL NOT NULL,
    "category" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "description" TEXT,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "recordedBy" INTEGER NOT NULL,
    "billUrl" TEXT,

    CONSTRAINT "Expense_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'INFO',
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SystemSetting" (
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SystemSetting_pkey" PRIMARY KEY ("key")
);

-- CreateTable
CREATE TABLE "Olt" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "brand" "OltBrand" NOT NULL DEFAULT 'BDCOM',
    "ponType" "PonType" NOT NULL DEFAULT 'EPON',
    "ipAddress" TEXT NOT NULL,
    "snmpCommunity" TEXT NOT NULL DEFAULT 'public',
    "snmpPort" INTEGER NOT NULL DEFAULT 161,
    "cliProtocol" "CliProtocol" NOT NULL DEFAULT 'TELNET',
    "cliPort" INTEGER NOT NULL DEFAULT 23,
    "username" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "enablePassword" TEXT,
    "ponPortCount" INTEGER NOT NULL DEFAULT 4,
    "uplinkPortCount" INTEGER NOT NULL DEFAULT 2,
    "location" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ONLINE',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isMock" BOOLEAN NOT NULL DEFAULT false,
    "hardwareModel" TEXT,
    "firmwareVersion" TEXT,
    "uptime" TEXT,
    "cpuUsage" DOUBLE PRECISION,
    "temperature" DOUBLE PRECISION,
    "lastSyncAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Olt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PonPort" (
    "id" SERIAL NOT NULL,
    "oltId" INTEGER NOT NULL,
    "portNumber" INTEGER NOT NULL,
    "portName" TEXT NOT NULL,
    "adminStatus" TEXT NOT NULL DEFAULT 'UP',
    "operStatus" TEXT NOT NULL DEFAULT 'UP',
    "maxOnus" INTEGER NOT NULL DEFAULT 64,
    "sfpModel" TEXT,
    "txPower" DOUBLE PRECISION,
    "rxPower" DOUBLE PRECISION,
    "temperature" DOUBLE PRECISION,
    "voltage" DOUBLE PRECISION,
    "current" DOUBLE PRECISION,
    "description" TEXT,

    CONSTRAINT "PonPort_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Onu" (
    "id" SERIAL NOT NULL,
    "oltId" INTEGER NOT NULL,
    "ponPortId" INTEGER,
    "portNumber" INTEGER NOT NULL,
    "onuId" INTEGER NOT NULL,
    "macAddress" TEXT,
    "serialNumber" TEXT,
    "name" TEXT,
    "model" TEXT,
    "vendor" TEXT,
    "status" "OnuStatus" NOT NULL DEFAULT 'ONLINE',
    "rxPower" DOUBLE PRECISION,
    "txPower" DOUBLE PRECISION,
    "oltRxPower" DOUBLE PRECISION,
    "distance" DOUBLE PRECISION,
    "vlanId" INTEGER,
    "vlanMode" TEXT DEFAULT 'TAG',
    "isAuthorized" BOOLEAN NOT NULL DEFAULT true,
    "lastOnline" TIMESTAMP(3),
    "lastOffline" TIMESTAMP(3),
    "lastDeregisterReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "customerId" INTEGER,

    CONSTRAINT "Onu_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SupportTicket" (
    "id" SERIAL NOT NULL,
    "ticketNo" TEXT NOT NULL,
    "customerId" INTEGER NOT NULL,
    "subject" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'GENERAL',
    "priority" TEXT NOT NULL DEFAULT 'MEDIUM',
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "message" TEXT NOT NULL,
    "adminReply" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SupportTicket_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE UNIQUE INDEX "Customer_phone_key" ON "Customer"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "Customer_pppoeUsername_key" ON "Customer"("pppoeUsername");

-- CreateIndex
CREATE INDEX "Customer_status_idx" ON "Customer"("status");

-- CreateIndex
CREATE INDEX "Customer_pppoeUsername_idx" ON "Customer"("pppoeUsername");

-- CreateIndex
CREATE INDEX "Customer_oltId_idx" ON "Customer"("oltId");

-- CreateIndex
CREATE UNIQUE INDEX "Invoice_publicToken_key" ON "Invoice"("publicToken");

-- CreateIndex
CREATE UNIQUE INDEX "Invoice_customerId_month_key" ON "Invoice"("customerId", "month");

-- CreateIndex
CREATE UNIQUE INDEX "Payment_trxId_key" ON "Payment"("trxId");

-- CreateIndex
CREATE INDEX "AuditLog_userId_idx" ON "AuditLog"("userId");

-- CreateIndex
CREATE INDEX "AuditLog_action_idx" ON "AuditLog"("action");

-- CreateIndex
CREATE UNIQUE INDEX "Staff_userId_key" ON "Staff"("userId");

-- CreateIndex
CREATE INDEX "Notification_userId_idx" ON "Notification"("userId");

-- CreateIndex
CREATE INDEX "Notification_isRead_idx" ON "Notification"("isRead");

-- CreateIndex
CREATE UNIQUE INDEX "PonPort_oltId_portNumber_key" ON "PonPort"("oltId", "portNumber");

-- CreateIndex
CREATE UNIQUE INDEX "Onu_customerId_key" ON "Onu"("customerId");

-- CreateIndex
CREATE INDEX "Onu_macAddress_idx" ON "Onu"("macAddress");

-- CreateIndex
CREATE INDEX "Onu_serialNumber_idx" ON "Onu"("serialNumber");

-- CreateIndex
CREATE UNIQUE INDEX "Onu_oltId_portNumber_onuId_key" ON "Onu"("oltId", "portNumber", "onuId");

-- CreateIndex
CREATE UNIQUE INDEX "SupportTicket_ticketNo_key" ON "SupportTicket"("ticketNo");

-- CreateIndex
CREATE INDEX "SupportTicket_customerId_idx" ON "SupportTicket"("customerId");

-- CreateIndex
CREATE INDEX "SupportTicket_status_idx" ON "SupportTicket"("status");

-- AddForeignKey
ALTER TABLE "Customer" ADD CONSTRAINT "Customer_packageId_fkey" FOREIGN KEY ("packageId") REFERENCES "Package"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Customer" ADD CONSTRAINT "Customer_routerId_fkey" FOREIGN KEY ("routerId") REFERENCES "Router"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Customer" ADD CONSTRAINT "Customer_oltId_fkey" FOREIGN KEY ("oltId") REFERENCES "Olt"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_receivedBy_fkey" FOREIGN KEY ("receivedBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Staff" ADD CONSTRAINT "Staff_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Income" ADD CONSTRAINT "Income_recordedBy_fkey" FOREIGN KEY ("recordedBy") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Expense" ADD CONSTRAINT "Expense_recordedBy_fkey" FOREIGN KEY ("recordedBy") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PonPort" ADD CONSTRAINT "PonPort_oltId_fkey" FOREIGN KEY ("oltId") REFERENCES "Olt"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Onu" ADD CONSTRAINT "Onu_oltId_fkey" FOREIGN KEY ("oltId") REFERENCES "Olt"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Onu" ADD CONSTRAINT "Onu_ponPortId_fkey" FOREIGN KEY ("ponPortId") REFERENCES "PonPort"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Onu" ADD CONSTRAINT "Onu_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupportTicket" ADD CONSTRAINT "SupportTicket_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

