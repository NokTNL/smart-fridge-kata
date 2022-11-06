export interface IState {
  date: Date;
  isDoorOpened: boolean;
  listOfItems: {
    name: string;
    expiry: Date;
    condition: "opened" | "sealed";
    addedTimeStamp: Date;
  }[];
}

/**
 * Utils functions
 */
/**
 * Returns dateA - dateB in full day.
 * NOTE: It rounds DOWN. 0.1 day rounds down to 0. -0.1 day rounds down to -1.
 */
const getFullDayDiff = (dateA: Date, dateB: Date) => {
  const millisecDiff = dateA.getTime() - dateB.getTime();
  const fullDayDiff = Math.floor(millisecDiff / (1000 * 60 * 60 * 24));
  return fullDayDiff;
};

export class Fridge {
  private state: IState;

  constructor(initState: IState) {
    this.state = initState;
  }

  setCurrentDate(dateString: string) {
    this.state.date = new Date(dateString);
  }

  signalFridgeDoorOpened() {
    this.state.isDoorOpened = true;
    this.state.listOfItems.forEach((item) => {
      const currentExpiry = item.expiry.getTime();
      if (item.condition === "opened") {
        item.expiry.setTime(currentExpiry - 5 * 60 * 60 * 1000); // deduct by 5 hours
      }
      if (item.condition === "sealed") {
        item.expiry.setTime(currentExpiry - 1 * 60 * 60 * 1000); // deduct by 1 hours
      }
    });
  }
  signalFridgeDoorClosed() {
    this.state.isDoorOpened = false;
  }
  scanAddedItem({
    name,
    expiry,
    condition,
  }: {
    name: string;
    expiry: string;
    condition: "opened" | "sealed";
  }) {
    if (!this.state.isDoorOpened) {
      throw Error("Door must be opened to add item");
    }
    this.state.listOfItems.push({
      name,
      expiry: new Date(expiry),
      condition,
      addedTimeStamp: this.state.date,
    });
  }
  scanRemovedItem({ name: targetName }: { name: string }) {
    const targetItemId = this.state.listOfItems.findIndex(
      (item) => item.name === targetName
    );
    if (targetItemId === -1) {
      throw Error(`The item "${targetName}" is not in the fridge!`);
    }
    this.state.listOfItems.splice(targetItemId, 1);
  }
  simulateDayOver() {
    const currentDate = this.state.date;
    currentDate.setDate(currentDate.getDate() + 1);
  }
  showDisplay() {
    const itemsWithFullDayExpiry = this.state.listOfItems.map((item) => ({
      ...item,
      daysTillExpiry: getFullDayDiff(item.expiry, this.state.date),
    }));
    const expiredItems = itemsWithFullDayExpiry.filter(
      (item) => item.daysTillExpiry < 0
    );
    const goodItems = itemsWithFullDayExpiry.filter(
      (item) => item.daysTillExpiry >= 0
    );
    const expiredItemsText = expiredItems
      .map((item) => `EXPIRED: ${item.name}`)
      .join("\n");
    const goodItemsText = goodItems
      .map(
        (item) =>
          `${item.name}: ${item.daysTillExpiry} day${
            item.daysTillExpiry === 1 ? "" : "s"
          } remaining`
      )
      .join("\n");

    return expiredItemsText + "\n" + goodItemsText;
  }
}
