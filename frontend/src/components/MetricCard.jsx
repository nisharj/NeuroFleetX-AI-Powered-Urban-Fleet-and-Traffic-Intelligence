export default function MetricCard({ title, value, color, icon }) {
  return (
    <div className={`p-6 rounded-lg shadow text-white ${color}`}>
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-medium">{title}</h2>
        <span className="text-3xl">{icon}</span>
      </div>
      <p className="text-4xl font-bold mt-4">{value}</p>
    </div>
  );
}
