"use strict";

const STATUS = Object.freeze({
  PENDING: "pending",
  ACCEPTED: "accepted",
  IN_PROGRESS: "in_progress",
  DELIVERED: "delivered",
  REVIEWED: "reviewed",
  REJECTED: "rejected",
});

module.exports = STATUS;
