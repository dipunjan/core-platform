type Props = {
  label?: string;
};

export function Spinner({ label = 'Loading…' }: Props) {
  return <p className="text-sm text-zinc-500">{label}</p>;
}
