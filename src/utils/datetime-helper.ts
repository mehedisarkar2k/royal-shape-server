export function isCurrentTimeGreater(givenTime: string, checkIn: Date): boolean {
  const [time, meridian] = givenTime.split(" ");
  const [givenHours, givenMinutes] = time.split(":").map(Number);

  // * convert given time to 24-hour format
  let givenHours24 = meridian === "PM" && givenHours !== 12 ? givenHours + 12 : givenHours;
  givenHours24 = meridian === "AM" && givenHours === 12 ? 0 : givenHours24;

  const givenDate = new Date();
  givenDate.setHours(givenHours24, givenMinutes, 0, 0);

  return checkIn.getTime() > givenDate.getTime();
}

export function isCurrentTimeLesser(givenTime: string, currentDateTime: Date): boolean {
  const [time, meridian] = givenTime.split(" ");
  const [givenHours, givenMinutes] = time.split(":").map(Number);

  // * convert given time to 24-hour format
  let givenHours24 = meridian === "PM" && givenHours !== 12 ? givenHours + 12 : givenHours;
  givenHours24 = meridian === "AM" && givenHours === 12 ? 0 : givenHours24;

  const givenDate = new Date();
  givenDate.setHours(givenHours24, givenMinutes, 0, 0);

  return currentDateTime.getTime() < givenDate.getTime();
}
