import { toast as sonnerToast } from "sonner";

type ToastInput={title:string;description?:string;variant?:"default"|"destructive"};
function showToast(input:ToastInput){
 const options={description:input.description};
 return input.variant==="destructive"?sonnerToast.error(input.title,options):sonnerToast.success(input.title,options);
}
export function useToast(){return{toast:showToast};}
export const toast=showToast;
