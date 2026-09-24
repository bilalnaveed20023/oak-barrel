/** Label that rolls up to a duplicate of itself on hover (pure CSS). */
export default function RollLabel({ children }: { children: string }) {
  return (
    <span className="roll" data-magnetic-inner>
      <span className="roll__track">
        <span className="roll__a">{children}</span>
        <span className="roll__b" aria-hidden="true">
          {children}
        </span>
      </span>
    </span>
  );
}
