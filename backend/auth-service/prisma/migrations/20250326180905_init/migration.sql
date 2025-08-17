-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "googleId" TEXT NOT NULL,
    "image" TEXT,
    "role" TEXT NOT NULL DEFAULT 'VIEWER',
    "isActive" boolean NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_googleId_key" ON "User"("googleId");

INSERT INTO "User" ("id", "email", "name", "googleId", "image", "role", "isActive", "createdAt", "updatedAt") VALUES
('04700a0f-e1a9-4662-88d9-bf093140d129','wadhwasumit@gmail.com', 'Sumit Wadhwa', '113138766342253835351', 'https://example.com/image.jpg', 'ADMIN', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);