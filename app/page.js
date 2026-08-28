import Link from "next/link";
import { getUnits } from "@/lib/data";

export default async function Home() {
  const units = await getUnits();
  const totalNodes = units.reduce((sum, u) => sum + u.nodeCount, 0);

  return (
    <main className="shell">
      <header className="masthead">
        <h1 className="wordmark">
          Luna<span className="moon">deck</span>
        </h1>
        <p className="standfirst">
          Seventy-eight cards, learned in order. {units.length} units,{" "}
          {totalNodes} exercises.
        </p>
      </header>

      <ol className="path">
        {units.map((unit) => (
          <li key={unit.number}>
            <Link className="stop" href={`/units/${unit.number}`}>
              <span className="stop-art">
                {unit.icon ? <img src={unit.icon} alt="" /> : null}
              </span>
              <span className="stop-body">
                <span className="stop-index">Unit {unit.number}</span>
                <span className="stop-name" style={{ display: "block" }}>
                  {unit.name}
                </span>
                <span className="stop-tagline" style={{ display: "block" }}>
                  {unit.tagline}
                </span>
                <span className="meta">
                  <span>{unit.cardCount} cards</span>
                  <span>{unit.nodeCount} nodes</span>
                  <span>~{unit.minutesTypical} min</span>
                </span>
              </span>
            </Link>
          </li>
        ))}
      </ol>
    </main>
  );
}
