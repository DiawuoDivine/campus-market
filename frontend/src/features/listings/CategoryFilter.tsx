import { Label } from '@/components/ui/label'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import type { CategoryDTO } from '@/lib/types'

export function CategoryFilter({
    categories,
    value,
    onChange,
}: {
    categories: CategoryDTO[]
    value: string
    onChange: (categoryId: string) => void
}) {
    return (
        <div className="space-y-2">
            <Label htmlFor="category-select">Category</Label>
            <Select value={value} onValueChange={onChange}>
                <SelectTrigger id="category-select">
                    <SelectValue placeholder="All categories" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="">All categories</SelectItem>
                    {categories.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                            {category.name}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
    )
}
