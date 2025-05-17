-- CreateTable
CREATE TABLE "ElseAction" (
    "id" TEXT NOT NULL,
    "suggestion" TEXT NOT NULL,
    "isMalicious" BOOLEAN NOT NULL DEFAULT false,
    "goalId" TEXT NOT NULL,
    "suggesterId" TEXT NOT NULL,
    "isChosen" BOOLEAN NOT NULL DEFAULT false,
    "voteCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ElseAction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserElseActionVote" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "elseActionId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserElseActionVote_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ElseAction_goalId_idx" ON "ElseAction"("goalId");

-- CreateIndex
CREATE INDEX "ElseAction_suggesterId_idx" ON "ElseAction"("suggesterId");

-- CreateIndex
CREATE INDEX "ElseAction_voteCount_idx" ON "ElseAction"("voteCount");

-- CreateIndex
CREATE INDEX "UserElseActionVote_elseActionId_idx" ON "UserElseActionVote"("elseActionId");

-- CreateIndex
CREATE INDEX "UserElseActionVote_userId_idx" ON "UserElseActionVote"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "UserElseActionVote_userId_elseActionId_key" ON "UserElseActionVote"("userId", "elseActionId");

-- AddForeignKey
ALTER TABLE "ElseAction" ADD CONSTRAINT "ElseAction_goalId_fkey" FOREIGN KEY ("goalId") REFERENCES "Goal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ElseAction" ADD CONSTRAINT "ElseAction_suggesterId_fkey" FOREIGN KEY ("suggesterId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserElseActionVote" ADD CONSTRAINT "UserElseActionVote_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserElseActionVote" ADD CONSTRAINT "UserElseActionVote_elseActionId_fkey" FOREIGN KEY ("elseActionId") REFERENCES "ElseAction"("id") ON DELETE CASCADE ON UPDATE CASCADE;
