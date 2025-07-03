export default function TestCSS() {
  return (
    <div className="min-h-screen bg-red-500 flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-lg">
        <h1 className="text-2xl font-bold text-blue-600 mb-4">
          TailwindCSS Test
        </h1>
        <p className="text-gray-600">
          If you see colors and styling, Tailwind is working!
        </p>
        <button className="mt-4 bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded">
          Test Button
        </button>
      </div>
    </div>
  )
}