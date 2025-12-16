-- CreateTable
CREATE TABLE "notification_sounds" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "file_name" TEXT NOT NULL,
    "file_url" TEXT NOT NULL,
    "file_size" INTEGER NOT NULL,
    "duration" INTEGER,
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "uploaded_by_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "notification_sounds_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_notification_sound_preferences" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "notification_type" "NotificationType" NOT NULL,
    "sound_id" TEXT,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_notification_sound_preferences_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "notification_sounds_is_active_idx" ON "notification_sounds"("is_active");

-- CreateIndex
CREATE INDEX "notification_sounds_is_default_idx" ON "notification_sounds"("is_default");

-- CreateIndex
CREATE INDEX "notification_sounds_uploaded_by_id_idx" ON "notification_sounds"("uploaded_by_id");

-- CreateIndex
CREATE INDEX "user_notification_sound_preferences_user_id_idx" ON "user_notification_sound_preferences"("user_id");

-- CreateIndex
CREATE INDEX "user_notification_sound_preferences_sound_id_idx" ON "user_notification_sound_preferences"("sound_id");

-- CreateIndex
CREATE UNIQUE INDEX "user_notification_sound_preferences_user_id_notification_ty_key" ON "user_notification_sound_preferences"("user_id", "notification_type");

-- AddForeignKey
ALTER TABLE "notification_sounds" ADD CONSTRAINT "notification_sounds_uploaded_by_id_fkey" FOREIGN KEY ("uploaded_by_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_notification_sound_preferences" ADD CONSTRAINT "user_notification_sound_preferences_sound_id_fkey" FOREIGN KEY ("sound_id") REFERENCES "notification_sounds"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_notification_sound_preferences" ADD CONSTRAINT "user_notification_sound_preferences_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
