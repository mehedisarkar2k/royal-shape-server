import { Request, Response } from "express";
import { v4 as uuid } from "uuid";
import { CreateComboInput } from "../schemas";
import { countCombos, createCombo, findAllCombosPaginated, findBranchesByIds, findComboById } from "../services";
import { ApplicationServices, DATA_NOT_FOUND } from "../constants";
import { SendErrorResponse, SendResponse } from "../utils";

const buildErrorPayload = (
  endpoint: string,
  functionName: string,
  method: string,
  message: string,
  error: { code: string; message: string },
  customMsg: string
) => ({
  message,
  data: {
    clientError: { ...error, message: customMsg },
    endpoint,
    functionName,
    method,
    service: ApplicationServices.COMBO,
    id: uuid()
  }
});

export async function createComboHandler(
  req: Request<Record<string, never>, Record<string, never>, CreateComboInput>,
  res: Response
) {
  const functionName = createComboHandler.name;
  const data = req.body;

  const branches = await findBranchesByIds(data.branchIds);
  if (branches.length !== data.branchIds.length) {
    return SendErrorResponse.notFound({
      res,
      ...buildErrorPayload(
        req.originalUrl,
        functionName,
        req.method,
        "Please verify the branch IDs provided.",
        DATA_NOT_FOUND,
        "One or more branches not found"
      )
    });
  }

  const combo = await createCombo({
    branches: branches.map((branch) => ({ branchId: branch._id.toString(), branchName: branch.name })),
    name: data.name,
    description: data.description,
    duration: data.duration,
    price: data.totalPrice,
    currency: "AUD",
    comboItems: data.comboItems
  });
  if (!combo) {
    return SendErrorResponse.internalServer({
      res,
      ...buildErrorPayload(
        req.originalUrl,
        functionName,
        req.method,
        "Combo creation failed",
        { code: "COMBO_CREATION_FAILED", message: "Combo creation failed" },
        "Failed to create combo. Please try again."
      )
    });
  }

  return SendResponse.success({
    res,
    message: "Combo created successfully",
    data: {
      combo: {
        id: combo._id.toString()
      }
    }
  });
}

export async function getAllCombosHandler(req: Request, res: Response) {
  // const functionName = getAllCombosHandler.name;
  const page = parseInt((req.query.page as string) || "1", 10);
  const limit = parseInt((req.query.limit as string) || "10", 10);

  const combos = await findAllCombosPaginated(page, limit);
  const totalCombos = await countCombos();
  const totalPages = Math.ceil(totalCombos / limit);
  const hasNext = page < totalPages;

  const formattedCombos = combos.map((combo) => ({
    id: combo._id.toString(),
    name: combo.name,
    description: combo.description,
    duration: combo.duration,
    price: combo.price,
    comboItems: combo.comboItems,
    branches: combo.branches
  }));

  return SendResponse.success({
    res,
    message: "Combos retrieved successfully",
    data: {
      items: formattedCombos,
      currentPage: page,
      limit,
      totalItems: totalCombos,
      totalPages,
      hasNext
    }
  });
}

export async function getSingleComboHandler(req: Request, res: Response) {
  const functionName = getSingleComboHandler.name;
  const { comboId } = req.params;

  const combo = await findComboById(comboId);
  if (!combo) {
    return SendErrorResponse.notFound({
      res,
      ...buildErrorPayload(
        req.originalUrl,
        functionName,
        req.method,
        `No combo found with ID: ${comboId}`,
        DATA_NOT_FOUND,
        "Combo not found"
      )
    });
  }

  return SendResponse.success({
    res,
    message: "Combo retrieved successfully",
    data: {
      combo: {
        id: combo._id.toString(),
        name: combo.name,
        description: combo.description,
        duration: combo.duration,
        price: combo.price,
        comboItems: combo.comboItems,
        branches: combo.branches
      }
    }
  });
}

export async function updateComboHandler(
  req: Request<Record<string, never>, Record<string, never>, CreateComboInput>,
  res: Response
) {
  const functionName = updateComboHandler.name;
  const data = req.body;
  const { comboId } = req.params;

  const combo = await findComboById(comboId);
  if (!combo) {
    return SendErrorResponse.notFound({
      res,
      ...buildErrorPayload(
        req.originalUrl,
        functionName,
        req.method,
        `No combo found with ID: ${comboId}`,
        DATA_NOT_FOUND,
        "Combo not found"
      )
    });
  }

  const branches = await findBranchesByIds(data.branchIds);
  if (branches.length !== data.branchIds.length) {
    return SendErrorResponse.notFound({
      res,
      ...buildErrorPayload(
        req.originalUrl,
        functionName,
        req.method,
        "Please verify the branch IDs provided.",
        DATA_NOT_FOUND,
        "One or more branches not found"
      )
    });
  }

  // if data provided and valid then update otherwise keep existing
  combo.name = data.name || combo.name;
  combo.description = data.description || combo.description;
  combo.duration = data.duration || combo.duration;
  combo.price = data.totalPrice || combo.price;
  combo.comboItems = data.comboItems || combo.comboItems;
  combo.branches =
    branches.length > 0
      ? branches.map((branch) => ({ branchId: branch._id.toString(), branchName: branch.name }))
      : combo.branches;

  await combo.save();

  return SendResponse.success({
    res,
    message: "Combo updated successfully",
    data: {
      combo: {
        id: combo._id.toString()
      }
    }
  });
}

export async function deleteComboHandler(req: Request, res: Response) {
  const functionName = deleteComboHandler.name;
  const { comboId } = req.params;

  const combo = await findComboById(comboId);
  if (!combo) {
    return SendErrorResponse.notFound({
      res,
      ...buildErrorPayload(
        req.originalUrl,
        functionName,
        req.method,
        `No combo found with ID: ${comboId}`,
        DATA_NOT_FOUND,
        "Combo not found"
      )
    });
  }

  await combo.deleteOne();

  return SendResponse.success({
    res,
    message: "Combo deleted successfully",
    data: null
  });
}
