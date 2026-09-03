type Props = {
  label?: string;
};

export function Spinner({ label = 'Loading…' }: Props) {
  return <p className="muted">{label}</p>;
}
