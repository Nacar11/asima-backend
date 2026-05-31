/** Self-service submit payload (employee submits for themselves). */
export type SubmitCorrectionInput = {
  employee_id: number;
  target_entry_id?: number | null;
  work_date: string;
  proposed_time_in: Date;
  proposed_time_out?: Date | null;
  reason: string;
};

/** HR pending-only edit (mirrors leave Q3). Does not touch the chain snapshot. */
export type UpdateCorrectionInput = {
  work_date?: string;
  proposed_time_in?: Date;
  proposed_time_out?: Date | null;
  reason?: string;
};
