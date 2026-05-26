import { usePlanning } from '../../context/PlanningContext';

export function ConfettiLayer() {
  const { confetti } = usePlanning();
  return (
    <>
      {confetti.map(p => (
        <div
          key={p.id}
          className="confetti-particle"
          style={{
            left: p.left,
            backgroundColor: p.color,
            width: p.size,
            height: p.size,
            animationDelay: p.delay,
            borderRadius: Math.random() > 0.5 ? '50%' : '0%',
          }}
        />
      ))}
    </>
  );
}
