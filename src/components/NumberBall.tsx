import './NumberBall.css';

type Props = {
  number: number;
  size?: 'sm' | 'md' | 'lg';
  bonus?: boolean;
  highlight?: boolean;
};

function getBallColor(n: number): string {
  if (n <= 10) return 'yellow';
  if (n <= 20) return 'blue';
  if (n <= 30) return 'red';
  if (n <= 40) return 'gray';
  return 'green';
}

export default function NumberBall({ number, size = 'md', bonus = false, highlight = false }: Props) {
  const color = getBallColor(number);
  return (
    <span
      className={`ball ball--${color} ball--${size}${bonus ? ' ball--bonus' : ''}${highlight ? ' ball--highlight' : ''}`}
      aria-label={`${number}${bonus ? ' (보너스)' : ''}`}
    >
      {number}
    </span>
  );
}
