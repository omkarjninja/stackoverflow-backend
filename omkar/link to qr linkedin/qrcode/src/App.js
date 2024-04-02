import logo from "./logo.svg";
import { useState } from "react";
import "./App.css";
import { QRCodeCanvas } from "qrcode.react";

function App() {
  const [url, seturl] = useState("");
  const downloadQR = () => {
    const img = document.createElement("a");
    img.href = document.getElementById("canvas").toDataURL();
    img.download = "qr.png";
    img.click();
  };
  return (
    <>
      <div class="px-4 mx-auto max-w-screen-xl text-center py-12 lg:py-24">
        <h1 class="mb-4 text-4xl font-extrabold tracking-tight leading-none text-black md:text-5xl lg:text-6xl">
          Link To QR Code Generator
        </h1>
      </div>
      <section class="grid place-items-center bg-white-900 p-8 ">
        <div class="flex gap-2">
          <input
            class="h-12 min-w-[12rem] rounded-lg border-gray-500 indent-4 text-emerald-900 shadow-lg focus:outline focus:ring focus:ring-emerald-600"
            type="text"
            placeholder="Enter Your URL"
          />

          <button
            onClick={downloadQR}
            class="h-12 min-w-[8rem] rounded-lg border-2 border-emerald-600 bg-emerald-500 text-emerald-50 shadow-lg hover:bg-emerald-600 focus:outline-none focus:ring focus:ring-emerald-600"
          >
            Download QR
          </button>
        </div>
      </section>
      <center>
        <QRCodeCanvas
          id="canvas"
          className="mt-3"
          style={{ display: "block", width: 300 }}
          value={url}
          size={300}
          renderAs="canvas"
        />
      </center>

      {/* <button onClick={downloadQR}>Download image</button> */}
    </>
  );
}

export default App;

<section class="grid place-items-center bg-emerald-900 p-16 min-h-screen">
  <div class="flex gap-4">
    <input
      class="h-12 min-w-[12rem] rounded-lg border-emerald-500 indent-4 text-emerald-900 shadow-lg focus:outline-none focus:ring focus:ring-emerald-600"
      type="text"
      placeholder="Designation"
    />

    <button class="h-12 min-w-[8rem] rounded-lg border-2 border-emerald-600 bg-emerald-500 text-emerald-50 shadow-lg hover:bg-emerald-600 focus:outline-none focus:ring focus:ring-emerald-600">
      Submit
    </button>
  </div>
</section>;
