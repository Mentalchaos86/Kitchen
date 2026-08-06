export const momentSettings = {
  // Completed timed events remain visible this long.
  completedEventRetentionMinutes: 120,

  // No Moment is shown for very short gaps.
  minimumGapMinutes: 45,

  // Hide the Moment once the next event becomes close.
  hideBeforeNextEventMinutes: 30,

  ideasByGap: {
    short: [
      "Take a proper break",
      "Reply to one message",
      "Make coffee or tea"
    ],
    medium: [
      "Take a walk",
      "Do the groceries",
      "Plan your next article",
      "Tidy one small area"
    ],
    long: [
      "Write a That’s Gaming article",
      "Edit a video",
      "Do the groceries",
      "Meal prep",
      "Take a longer walk"
    ]
  }
};
