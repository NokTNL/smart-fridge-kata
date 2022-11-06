import { Fridge, IState } from "./Fridge";

const getDefaultState = (): IState => ({
  date: new Date("1970-01-01"),
  isDoorOpened: false,
  listOfItems: [],
});

describe("Acceptance test", () => {
  test("Happy path", () => {
    const fridge = new Fridge({
      ...getDefaultState(),
      date: new Date("1970-01-01"),
    });

    // Setup:
    fridge.setCurrentDate("2021-10-20"); // 🤯 Original: 2021-10-18

    // Input:
    fridge.signalFridgeDoorOpened();
    fridge.scanAddedItem({
      name: "Milk",
      expiry: "2021-10-21",
      condition: "sealed",
    });
    fridge.scanAddedItem({
      name: "Cheese",
      expiry: "2021-11-18",
      condition: "sealed",
    });
    fridge.scanAddedItem({
      name: "Beef",
      expiry: "2021-10-20",
      condition: "sealed",
    });
    fridge.scanAddedItem({
      name: "Lettuce",
      expiry: "2021-10-22",
      condition: "sealed",
    });
    fridge.signalFridgeDoorClosed();

    fridge.simulateDayOver();

    fridge.signalFridgeDoorOpened();
    fridge.signalFridgeDoorClosed();

    fridge.signalFridgeDoorOpened();
    fridge.signalFridgeDoorClosed();

    fridge.signalFridgeDoorOpened();
    fridge.scanRemovedItem({ name: "Milk" });
    fridge.signalFridgeDoorClosed();

    fridge.signalFridgeDoorOpened();
    fridge.scanAddedItem({
      name: "Milk",
      expiry: "2021-10-26",
      condition: "opened",
    });
    fridge.scanAddedItem({
      name: "Peppers",
      expiry: "2021-10-23",
      condition: "opened",
    });
    fridge.signalFridgeDoorClosed();

    fridge.simulateDayOver();

    fridge.signalFridgeDoorOpened();
    fridge.scanRemovedItem({ name: "Beef" });
    fridge.scanRemovedItem({ name: "Lettuce" });
    fridge.signalFridgeDoorClosed();

    fridge.signalFridgeDoorOpened();
    fridge.scanAddedItem({
      name: "Lettuce",
      expiry: "2021-10-22",
      condition: "opened",
    });
    fridge.signalFridgeDoorClosed();

    fridge.signalFridgeDoorOpened();
    fridge.signalFridgeDoorClosed();

    fridge.simulateDayOver();

    // Output:
    const displayText = fridge.showDisplay();
    expect(displayText).toEqual(
      /* 🤯 Original: 
      [
        "EXPIRED: Milk",
        "Lettuce: 0 days remaining",
        "Peppers: 1 day remaining",
        "Cheese: 31 days remaining",
      ].join("\n") */
      [
        "EXPIRED: Peppers",
        "EXPIRED: Lettuce",
        "Cheese: 25 days remaining",
        "Milk: 2 days remaining",
      ].join("\n")
    );
  });
});

describe("Unit tests", () => {
  test("Set current date", () => {
    const mockInitState = {
      ...getDefaultState(),
    };
    const fridge = new Fridge(mockInitState);
    fridge.setCurrentDate("2021-10-18");
    expect(mockInitState.date).toEqual(new Date("2021-10-18"));
  });
  test("signalFridgeDoorOpened & signalFridgeDoorClosed opens/closes the fridge", () => {
    const mockState = {
      ...getDefaultState(),
    }; // default closed
    const fridge = new Fridge(mockState);
    fridge.signalFridgeDoorOpened();
    expect(mockState.isDoorOpened).toBe(true);
    fridge.signalFridgeDoorClosed();
    expect(mockState.isDoorOpened).toBe(false);
  });
  test("signalFridgeDoorOpened accelerates expiry", () => {
    const mockState: IState = {
      ...getDefaultState(),
      listOfItems: [
        {
          name: "Milk",
          expiry: new Date("2021-01-31"),
          condition: "opened",
          addedTimeStamp: new Date("1970-01-01"),
        },
        {
          name: "Cheese",
          expiry: new Date("2021-01-31"),
          condition: "sealed",
          addedTimeStamp: new Date("1970-01-01"),
        },
      ],
    };
    const fridge = new Fridge(mockState);
    fridge.signalFridgeDoorOpened();
    expect(mockState.listOfItems).toEqual([
      {
        name: "Milk",
        expiry: new Date("2021-01-30T19:00:00"), // expires by 5 hours
        condition: "opened",
        addedTimeStamp: new Date("1970-01-01"),
      },
      {
        name: "Cheese",
        expiry: new Date("2021-01-30T23:00:00"), // expires by 1 hour
        condition: "sealed",
        addedTimeStamp: new Date("1970-01-01"),
      },
    ]);
  });
  test("Fridge door must be opened to add items", () => {
    const doorOpenedInitState = {
      ...getDefaultState(),
      isDoorOpened: true,
    };
    const openedFridge = new Fridge(doorOpenedInitState);
    expect(() => {
      openedFridge.scanAddedItem({
        name: "Milk",
        expiry: "2021-10-18",
        condition: "opened",
      });
    }).not.toThrow("Door must be opened to add item");

    const doorClosedInitState = {
      ...getDefaultState(),
      isDoorOpened: false,
    };
    const closedFridge = new Fridge(doorClosedInitState);
    expect(() => {
      closedFridge.scanAddedItem({
        name: "Milk",
        expiry: "2021-10-18",
        condition: "opened",
      });
    }).toThrow("Door must be opened to add item");
  });
  test("scanAddedItem adds a new item to the repository", () => {
    const mockState = {
      ...getDefaultState(),
      isDoorOpened: true,
    }; // empty fridge, default date = "1970-01-01"
    const fridge = new Fridge(mockState);
    fridge.scanAddedItem({
      name: "Milk",
      expiry: "2021-10-21",
      condition: "sealed",
    });
    expect(mockState.listOfItems).toEqual([
      {
        name: "Milk",
        expiry: new Date("2021-10-21"),
        condition: "sealed",
        addedTimeStamp: new Date("1970-01-01"),
      },
    ]);
  });
  test("simulateDayOver ticks the clock by 1 day", () => {
    const mockState = {
      ...getDefaultState(),
    }; // default date = "1970-01-01"
    const fridge = new Fridge(mockState);
    fridge.simulateDayOver();
    expect(mockState.date).toEqual(new Date("1970-01-02"));
  });
  test(`scanRemovedItem can't remove non-existing items`, () => {
    const mockState: IState = {
      ...getDefaultState(),
      listOfItems: [
        {
          name: "Milk",
          expiry: new Date("2021-10-21"),
          condition: "sealed",
          addedTimeStamp: new Date("1970-01-01"),
        },
      ],
    };
    const fridge = new Fridge(mockState);
    expect(() => {
      fridge.scanRemovedItem({ name: "Beef" });
    }).toThrowError(`The item "Beef" is not in the fridge!`);
  });
  test(`scanRemovedItem removes the target item`, () => {
    const mockState: IState = {
      ...getDefaultState(),
      listOfItems: [
        {
          name: "Milk",
          expiry: new Date("2021-10-21"),
          condition: "sealed",
          addedTimeStamp: new Date("1970-01-01"),
        },
        {
          name: "Cheese",
          expiry: new Date("2021-11-18"),
          condition: "sealed",
          addedTimeStamp: new Date("1970-01-01"),
        },
      ],
    };
    const fridge = new Fridge(mockState);
    fridge.scanRemovedItem({ name: "Cheese" });
    expect(mockState.listOfItems).toEqual([
      {
        name: "Milk",
        expiry: new Date("2021-10-21"),
        condition: "sealed",
        addedTimeStamp: new Date("1970-01-01"),
      },
    ]);
  });
  test("showDisplay displays the expected result", () => {
    const mockState: IState = {
      ...getDefaultState(),
      date: new Date("2021-02-01"),
      listOfItems: [
        {
          name: "Milk",
          expiry: new Date("2021-01-31T23:00:00"), // same day but expired by 1 hour
          condition: "sealed",
          addedTimeStamp: new Date(),
        },
        {
          name: "Cheese",
          expiry: new Date("2021-03-01T14:00:00"), // 28.X days before expiry
          condition: "sealed",
          addedTimeStamp: new Date(),
        },
      ],
    };
    const fridge = new Fridge(mockState);
    expect(fridge.showDisplay()).toEqual(
      [
        "EXPIRED: Milk", //
        "Cheese: 28 days remaining",
      ].join("\n")
    );
  });
});
