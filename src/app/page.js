// src/app/page.js
import Cars from "./cars";
import CreateCar from "./createcar";

function Page() {
  return (
    <main className="min-h-screen p-8">
      <h1 className="text-3xl font-bold mb-8 text-black">
        Car Care Management
      </h1>
      <CreateCar />
      <Cars />
    </main>
  );
}

export default Page;
