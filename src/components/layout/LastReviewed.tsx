type Props = {
  reviewedAt?: string;
};

/**
 * Shows "Last reviewed: YYYY-MM-DD" only when reviewedAt is set in the catalog.
 */
export function LastReviewed({ reviewedAt }: Props) {
  if (!reviewedAt) return null;
  return (
    <p className="mt-2 text-[13px] text-zinc-600">
      Last reviewed: {reviewedAt}
    </p>
  );
}
