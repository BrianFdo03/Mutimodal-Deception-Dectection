import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  ReferenceLine,
} from "recharts";

export default function InconsistencyTimeline({ timeline, onSegmentClick }) {
  if (!timeline || timeline.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900">
          Behavioral Inconsistency Timeline
        </h2>
        <div className="h-72 flex items-center justify-center text-gray-400">
          Timeline will appear after analysis.
        </div>
      </div>
    );
  }

  const chartData = timeline.map((item) => ({
    ...item,
    timeLabel: `${item.start}s`,
  }));

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">
            Behavioral Inconsistency Timeline
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Smoothed score is shown for readability. Raw score is available in
            the tooltip.
          </p>
        </div>

        <div className="flex gap-3 text-xs">
          <span className="px-2 py-1 rounded-full bg-green-100 text-green-700">
            Low
          </span>
          <span className="px-2 py-1 rounded-full bg-yellow-100 text-yellow-700">
            Medium
          </span>
          <span className="px-2 py-1 rounded-full bg-red-100 text-red-700">
            High
          </span>
        </div>
      </div>

      <div className="h-80 mt-6">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />

            <XAxis
              dataKey="start"
              tickFormatter={(value) => `${value}s`}
              label={{
                value: "Time",
                position: "insideBottom",
                offset: -5,
              }}
            />

            <YAxis
              domain={[0, 1]}
              label={{
                value: "Score",
                angle: -90,
                position: "insideLeft",
              }}
            />

            <Tooltip
              formatter={(value, name) => [
                Number(value).toFixed(4),
                name === "smoothed_score" ? "Smoothed Score" : "Raw Score",
              ]}
              labelFormatter={(_, payload) => {
                if (!payload || payload.length === 0) return "";
                const item = payload[0].payload;
                return `Time: ${item.start}s - ${item.end}s | Risk: ${item.risk}`;
              }}
            />

            <ReferenceLine y={0.4} strokeDasharray="5 5" />
            <ReferenceLine y={0.7} strokeDasharray="5 5" />

            <Line
              type="monotone"
              dataKey="raw_score"
              strokeWidth={1}
              dot={false}
              opacity={0.35}
            />

            <Line
              type="monotone"
              dataKey="smoothed_score"
              strokeWidth={3}
              dot={{ r: 4 }}
              activeDot={{
                r: 7,
                onClick: (_, payload) => {
                  if (payload?.payload) {
                    onSegmentClick(payload.payload);
                  }
                },
              }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
