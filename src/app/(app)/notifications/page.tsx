"use client";

import { motion } from "framer-motion";
import { BellSimple } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import {
  NotificationItem,
  mockNotifications,
} from "@/components/notifications/notification-item";
import { appContent } from "@/content/app";

const { notifications: content } = appContent;

const containerVariants = { hidden: {}, show: { transition: { staggerChildren: 0.04 } } };

const itemVariants = {
  hidden: { opacity: 0, y: 10, filter: "blur(2px)" },
  show: { opacity: 1, y: 0, filter: "blur(0px)", transition: { duration: 0.3, ease: [0.25, 0.1, 0.25, 1] as const } },
};

export default function NotificationsPage() {
  const unreadCount = mockNotifications.filter((n) => !n.is_read).length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 24, filter: "blur(4px)" }}
      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      transition={{ duration: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
      className="flex flex-1 flex-col px-4 py-8 md:px-6 md:py-10 gradient-crimson"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-display text-foreground">{content.heading}</h1>
          {unreadCount > 0 && (
            <span className="flex h-6 min-w-6 items-center justify-center rounded-full bg-primary px-2 text-sm font-bold text-primary-foreground tabular-nums">
              {unreadCount}
            </span>
          )}
        </div>
        {unreadCount > 0 && (
          <Button variant="ghost" size="sm" className="text-sm text-muted-foreground">
            {content.markAllRead}
          </Button>
        )}
      </div>

      {mockNotifications.length === 0 ? (
        <div className="mt-12 flex flex-1 flex-col items-center justify-center text-center py-8">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/8">
            <BellSimple weight="duotone" className="h-10 w-10 text-primary/60" />
          </div>
          <p className="mt-4 text-lg font-semibold text-foreground">{content.emptyState.title}</p>
          <p className="mt-2 text-base text-muted-foreground max-w-80">{content.emptyState.description}</p>
        </div>
      ) : (
        <motion.div variants={containerVariants} initial="hidden" animate="show" className="mt-6 space-y-3">
          {mockNotifications.map((notification) => (
            <motion.div
              key={notification.id}
              variants={itemVariants}
              className={`relative overflow-hidden rounded-xl border border-border/10 bg-card p-5 pl-7 shadow-sm card-hover ${
                notification.is_read ? "opacity-40" : ""
              }`}
            >
              <div className="accent-bar-left" />
              <NotificationItem notification={notification} />
            </motion.div>
          ))}
        </motion.div>
      )}
    </motion.div>
  );
}
