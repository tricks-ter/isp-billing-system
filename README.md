# 🌐 ISP Billing & Management System

> A robust, modern, full-stack ISP billing and administration system tailored for Internet Service Providers. Designed with deep MikroTik RouterOS integration, automated billing cycles, and complete network diagnostics.

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![React](https://img.shields.io/badge/React-18-blue.svg)
![Node.js](https://img.shields.io/badge/Node.js-20-green.svg)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-blue.svg)

---

## ✨ Key Features
- **MikroTik RouterOS Integration**: Deep API integration for managing PPPoE/Hotspot users, monitoring live bandwidth, and checking router health.
- **Automated Billing & Finance**: Recurring invoice generation, payment tracking, grace period handling, and auto-disconnect for unpaid dues.
- **Real-time Diagnostics**: One-click connection pool API status, active interface monitoring, and actionable network diagnostics.
- **Robust Access Control**: Role-Based Access Control (RBAC) with detailed audit logging for security and compliance.
- **Modern UI**: A responsive, clean React frontend styled with Tailwind CSS, featuring light/dark mode and multilingual support (Bengali/English).

---

## 🏗️ Architecture Overview

The project is structured as a monorepo containing distinct frontend and backend layers:

- `/backend`: Node.js, Express REST API, Prisma ORM (connected to PostgreSQL), JWT Authentication, and the MikroTik API wrapper (`RouterOS`).
- `/frontend`: React SPA built with Vite, Tailwind CSS, and `framer-motion` for smooth UI transitions. Features complex context-based state management.
- `/database`: Raw SQL schemas, Prisma migrations, and baseline seed data.
- `/docs`: Comprehensive system architecture and implementation documentation.

---

## 🚀 Quick Start Guide

### Prerequisites
- Node.js (v18 or higher)
- PostgreSQL (v14 or higher)
- Access to a MikroTik Router (optional, for live integration)

### 1. Backend Setup
```bash
cd backend
npm install
```
Configure your environment variables:
```bash
cp .env.example .env
# Edit .env with your PostgreSQL credentials and JWT secret
```
Run database migrations and start the server:
```bash
npx prisma migrate dev
npm run dev
```
*(The API will be available at `http://localhost:5000`)*

### 2. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
*(The web UI will be available at `http://localhost:3000`)*

---

## 🔒 Security & Best Practices
- **Never commit `.env` files**: All secrets are ignored by git.
- **Robust Error Handling**: The backend gracefully captures connection failures to routers and masks sensitive credentials in the API response.
- **Audit Trails**: Every sensitive action (billing adjustment, router configuration) is tracked in the system audit logs.

## 📄 License
This project is licensed under the MIT License.
