import Moralis from "moralis";

try {
  await Moralis.start({
    apiKey:
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJub25jZSI6IjVlZjI4YjkxLTBiYjktNDJlOS1iMWZlLWJmMzE2YWZhMDk0NSIsIm9yZ0lkIjoiNDQ0NjM2IiwidXNlcklkIjoiNDU3NDc2IiwidHlwZUlkIjoiMWFiNzQ5MTEtYzY3YS00NzYwLTk2YTktZjFmY2FjZTUwMjM5IiwidHlwZSI6IlBST0pFQ1QiLCJpYXQiOjE3NDYwMjEzMzUsImV4cCI6NDkwMTc4MTMzNX0.EXOLzghiQHyCkP2dJyLHsnuenYRGRlu_pyVeWDBpUPw",
  });

  const response = await Moralis.EvmApi.token.getTokenPrice({
    chain: 369,
    address: "0x88dF7BEdc5969371A2C9A74690cBB3668061E1E9",
  });

  console.log(response.raw);
} catch (error) {
  console.error("Error fetching token price:", error);
  throw error;
}
