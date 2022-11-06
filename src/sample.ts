import { Fridge } from "./Fridge";

const mockInitState = {
  date: new Date("2000-01-01"), // This can't be empty, can be anything and will be changed
};
const { setCurrentDate } = new Fridge(mockInitState);
setCurrentDate("2021-10-18");
