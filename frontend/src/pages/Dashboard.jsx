import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    ArcElement,
    Title,
    Tooltip,
    Legend,
    RadialLinearScale,
} from "chart.js";
import { Line, Doughnut, Bar } from "react-chartjs-2";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Target } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { format } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Calendar } from "@/components/ui/calendar";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import {
    Pagination,
    PaginationContent,
    PaginationItem,
    PaginationNext,
    PaginationPrevious,
} from "@/components/ui/pagination";

// Register Chart.js components
ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    ArcElement,
    Title,
    Tooltip,
    Legend,
    RadialLinearScale
);
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectLabel,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

export default function Dashboard() {
    const navigate = useNavigate();

    // Dashboard Data State
    const [dailyGoal, setDailyGoal] = useState({});
    const [todayActuals, setTodayActuals] = useState({});

    // Pagination & Filtering State
    const [paginatedFoodItems, setPaginatedFoodItems] = useState([]);
    const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
    const [dateRange, setDateRange] = useState({ from: undefined, to: undefined });

    // Chart Data State
    const [weeklyData, setWeeklyData] = useState([]);
    const [todayTrendData, setTodayTrendData] = useState([]);

    // Chart Rendering State
    const [lineChartData, setLineChartData] = useState(null);
    const [pieChartData, setPieChartData] = useState(null);
    const [radarChartData, setRadarChartData] = useState(null);

    // Toggle States
    const [showMacroWeekly, setShowMacroWeekly] = useState(false);
    const [showMicroWeekly, setShowMicroWeekly] = useState(false);

    useEffect(() => {
        fetchDashboardData();
    }, []);

    useEffect(() => {
        buildCharts();
    }, [weeklyData, todayActuals, dailyGoal, showMacroWeekly, showMicroWeekly, todayTrendData]);

    useEffect(() => {
        if (dailyGoal && dailyGoal.targetCalories) {
            setGoalTargetCalories(dailyGoal.targetCalories);
            setGoalTargetProtein(dailyGoal.targetProtein || 0);
            setGoalTargetCarbs(dailyGoal.targetCarbs || 0);
            setGoalTargetFat(dailyGoal.targetFat || 0);
        }
    }, [dailyGoal]);

    const fetchDashboardData = async () => {
        try {
            const [todayRes, weeklyRes, todayTrendRes] = await Promise.all([
                api.get("/reports/today"),
                api.get("/reports/weekly"),
                api.get("/reports/today-trend"),
            ]);

            setDailyGoal(todayRes.data.goal);
            setTodayActuals(todayRes.data.actual);

            setWeeklyData(weeklyRes.data);
            setTodayTrendData(todayTrendRes.data);

        } catch (err) {
            console.error("Error fetching dashboard data:", err);
            if (err.response?.status === 401 || err.response?.status === 403) {
                handleLogout();
            }
        }
    };

    const fetchFoodItems = async () => {
        try {
            const params = { page: pagination.page, limit: 10 };
            if (dateRange?.from) {
                const fromDate = new Date(dateRange.from);
                fromDate.setHours(0, 0, 0, 0);
                params.startDate = fromDate.toISOString();
            }
            if (dateRange?.to) {
                const toDate = new Date(dateRange.to);
                toDate.setHours(23, 59, 59, 999);
                params.endDate = toDate.toISOString();
            }

            const res = await api.get("/meals/food-items", { params });
            setPaginatedFoodItems(res.data.foodItems);
            setPagination(res.data.pagination);
        } catch (err) {
            console.error("Error fetching food items", err);
        }
    };

    useEffect(() => {
        fetchFoodItems();
    }, [pagination.page, dateRange]);

    const buildCharts = () => {
        // 1. Weekly Calorie Trend (Line Chart)
        if (weeklyData.length > 0) {
            const labels = weeklyData.map((d) => {
                const dateObj = new Date(d._id);
                dateObj.setMinutes(dateObj.getMinutes() + dateObj.getTimezoneOffset());
                return dateObj.toLocaleDateString("en-US", { weekday: "short" });
            });
            const dataPoints = weeklyData.map((d) => d.totalCalories);

            setLineChartData({
                labels,
                datasets: [
                    {
                        label: "Calories Consumed",
                        data: dataPoints,
                        borderColor: "rgba(0,0,0,1)",
                        backgroundColor: "rgba(0,0,0,0.1)",
                        tension: 0.4,
                        fill: true,
                    },
                    {
                        label: "Daily Target",
                        data: weeklyData.map(d => d.targetCalories || dailyGoal.targetCalories || 0),
                        borderColor: "rgba(156, 163, 175, 1)", // Tailwind gray-400
                        borderDash: [5, 5],
                        pointRadius: 0,
                        fill: false,
                    },
                ],
            });
        }

        // 2. Macronutrient Breakdown (Doughnut Chart)
        if (showMacroWeekly) {
            // Total Weekly
            let wProtein = 0, wCarbs = 0, wFat = 0;
            weeklyData.forEach(d => { wProtein += d.totalProtein; wCarbs += d.totalCarbs; wFat += d.totalFat; });
            setPieChartData({
                labels: ["Protein", "Carbs", "Fat"],
                datasets: [
                    {
                        data: [wProtein, wCarbs, wFat],
                        backgroundColor: [
                            "rgba(0, 0, 0, 0.8)",
                            "rgba(100, 100, 100, 0.8)",
                            "rgba(200, 200, 200, 0.8)",
                        ],
                        borderWidth: 1,
                        borderColor: "#fff"
                    },
                ],
            });
        } else {
            // Today Only
            setPieChartData({
                labels: ["Protein", "Carbs", "Fat"],
                datasets: [
                    {
                        data: [
                            todayActuals.consumedProtein || 0,
                            todayActuals.consumedCarbs || 0,
                            todayActuals.consumedFat || 0,
                        ],
                        backgroundColor: [
                            "rgba(0, 0, 0, 0.8)",
                            "rgba(100, 100, 100, 0.8)",
                            "rgba(200, 200, 200, 0.8)",
                        ],
                        borderWidth: 1,
                        borderColor: "#fff"
                    },
                ],
            });
        }

        // 3. Micronutrient Summary (Bar Chart)
        const microLabels = ["Vit A", "Vit C", "Vit D", "Iron", "Calcium", "Magnesium"];
        if (showMicroWeekly) {
            // Total Weekly
            let mVitA = 0, mVitC = 0, mVitD = 0, mIron = 0, mCalc = 0, mMag = 0;
            weeklyData.forEach(d => {
                mVitA += d.totalVitA || 0; mVitC += d.totalVitC || 0; mVitD += d.totalVitD || 0;
                mIron += d.totalIron || 0; mCalc += d.totalCalcium || 0; mMag += d.totalMagnesium || 0;
            });
            setRadarChartData({
                labels: microLabels,
                datasets: [
                    {
                        label: "Total Traced Input",
                        data: [mVitA, mVitC, mVitD, mIron, mCalc, mMag],
                        backgroundColor: "rgba(0,0,0,0.8)",
                    },
                ],
            });
        } else {
            // Today Only
            setRadarChartData({
                labels: microLabels,
                datasets: [
                    {
                        label: "Total Traced Input",
                        data: [
                            todayActuals.consumedVitA || 0,
                            todayActuals.consumedVitC || 0,
                            todayActuals.consumedVitD || 0,
                            todayActuals.consumedIron || 0,
                            todayActuals.consumedCalcium || 0,
                            todayActuals.consumedMagnesium || 0,
                        ],
                        backgroundColor: "rgba(0,0,0,0.8)",
                    },
                ],
            });
        }
    };

    // Dialog States
    const [isGoalOpen, setIsGoalOpen] = useState(false);
    const [isMealOpen, setIsMealOpen] = useState(false);

    // Goal Form State
    const [goalTargetCalories, setGoalTargetCalories] = useState(2000);
    const [goalTargetProtein, setGoalTargetProtein] = useState(150);
    const [goalTargetCarbs, setGoalTargetCarbs] = useState(200);
    const [goalTargetFat, setGoalTargetFat] = useState(65);
    const [isSavingGoal, setIsSavingGoal] = useState(false);

    // Meal Form State
    const [mealType, setMealType] = useState("");
    const [mealDate, setMealDate] = useState(new Date().toISOString().slice(0, 10)); // YYYY-MM-DD
    const [mealPhoto, setMealPhoto] = useState(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [isSavingMeal, setIsSavingMeal] = useState(false);
    const [foodItems, setFoodItems] = useState([
        {
            name: "",
            quantity: 1,
            calories: 0,
            protein: 0,
            carbs: 0,
            fat: 0,
            vitamins: { a: 0, c: 0, d: 0 },
            minerals: { iron: 0, calcium: 0, magnesium: 0 },
        },
    ]);

    const handleLogout = () => {
        localStorage.removeItem("token");
        navigate("/login");
    };

    const handleGoalSubmit = async (e) => {
        e.preventDefault();
        setIsSavingGoal(true);
        try {
            await api.post("/goals", {
                dailyCalorieTarget: parseInt(goalTargetCalories),
                proteinTarget: parseInt(goalTargetProtein),
                carbTarget: parseInt(goalTargetCarbs),
                fatTarget: parseInt(goalTargetFat),
            });
            setIsGoalOpen(false);
            fetchDashboardData();
        } catch (err) {
            console.error("Failed to save goals:", err);
            alert("Error saving goals.");
        } finally {
            setIsSavingGoal(false);
        }
    };

    const handleImageUpload = (e) => {
        if (e.target.files && e.target.files.length > 0) {
            setMealPhoto(e.target.files[0]);
        }
    };

    const analyzeImage = async () => {
        if (!mealPhoto) {
            alert("Please select an image first.");
            return;
        }

        setIsAnalyzing(true);
        try {
            const formData = new FormData();
            formData.append("image", mealPhoto);

            const response = await api.post("/ai/analyze-food", formData, {
                headers: { "Content-Type": "multipart/form-data" },
            });

            const analysis = response.data;
            if (Array.isArray(analysis) && analysis.length > 0) {
                setFoodItems(analysis);
            }
        } catch (err) {
            console.error("AI Analysis failed:", err);
            alert("Failed to analyze image. You can still input data manually.");
        } finally {
            setIsAnalyzing(false);
        }
    };

    const addManualItem = () => {
        setFoodItems([
            ...foodItems,
            {
                name: "",
                quantity: 1,
                calories: 0,
                protein: 0,
                carbs: 0,
                fat: 0,
                vitamins: { a: 0, c: 0, d: 0 },
                minerals: { iron: 0, calcium: 0, magnesium: 0 },
            },
        ]);
    };

    const removeFoodItem = (index) => {
        const updated = [...foodItems];
        updated.splice(index, 1);
        setFoodItems(updated);
    };

    const handleMealSubmit = async (e) => {
        e.preventDefault();
        if (!mealType) {
            alert("Please select a meal type.");
            return;
        }

        setIsSavingMeal(true);
        try {
            const itemsToSave = foodItems.map((item) => ({
                ...item,
                quantity: Number(item.quantity) || 1,
                calories: Number(item.calories) || 0,
                protein: Number(item.protein) || 0,
                carbs: Number(item.carbs) || 0,
                fat: Number(item.fat) || 0,
            }));

            await api.post("/meals/add", {
                mealType,
                date: new Date(mealDate).toISOString(),
                foodItems: itemsToSave,
            });

            setIsMealOpen(false);
            setMealType("");
            setMealPhoto(null);
            setFoodItems([
                {
                    name: "",
                    quantity: 1,
                    calories: 0,
                    protein: 0,
                    carbs: 0,
                    fat: 0,
                    vitamins: { a: 0, c: 0, d: 0 },
                    minerals: { iron: 0, calcium: 0, magnesium: 0 },
                },
            ]);
            fetchDashboardData();
        } catch (err) {
            console.error("Error saving meal:", err);
            alert("Failed to save meal.");
        } finally {
            setIsSavingMeal(false);
        }
    };

    return (
        <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Calorie Tracker</h1>
                    <p className="text-muted-foreground mt-1">
                        Monitor your daily intake and visualize your progress.
                    </p>
                </div>
                <div className="flex gap-2 w-full sm:w-auto">
                    {/* Setup Goals Modal */}
                    <Dialog open={isGoalOpen} onOpenChange={setIsGoalOpen}>
                        <DialogTrigger asChild>
                            <Button variant="outline" className="w-full sm:w-auto">
                                <Target className="w-4 h-4 mr-2" />
                                Setup Goals
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[425px]">
                            <DialogHeader>
                                <DialogTitle>Setup Daily Goals</DialogTitle>
                                <DialogDescription>
                                    Set your target macros. These will be used to track your daily progress.
                                </DialogDescription>
                            </DialogHeader>
                            <form onSubmit={handleGoalSubmit}>
                                <div className="grid gap-4 py-4">
                                    <div className="grid grid-cols-4 items-center gap-4">
                                        <Label htmlFor="goal-cal" className="text-right">Calories</Label>
                                        <Input id="goal-cal" type="number" min="0" value={goalTargetCalories} onChange={(e) => setGoalTargetCalories(e.target.value)} className="col-span-3" required />
                                    </div>
                                    <div className="grid grid-cols-4 items-center gap-4">
                                        <Label htmlFor="goal-pro" className="text-right">Protein (g)</Label>
                                        <Input id="goal-pro" type="number" min="0" value={goalTargetProtein} onChange={(e) => setGoalTargetProtein(e.target.value)} className="col-span-3" required />
                                    </div>
                                    <div className="grid grid-cols-4 items-center gap-4">
                                        <Label htmlFor="goal-carbs" className="text-right">Carbs (g)</Label>
                                        <Input id="goal-carbs" type="number" min="0" value={goalTargetCarbs} onChange={(e) => setGoalTargetCarbs(e.target.value)} className="col-span-3" required />
                                    </div>
                                    <div className="grid grid-cols-4 items-center gap-4">
                                        <Label htmlFor="goal-fat" className="text-right">Fat (g)</Label>
                                        <Input id="goal-fat" type="number" min="0" value={goalTargetFat} onChange={(e) => setGoalTargetFat(e.target.value)} className="col-span-3" required />
                                    </div>
                                </div>
                                <DialogFooter>
                                    <Button type="submit" disabled={isSavingGoal}>
                                        {isSavingGoal ? "Saving..." : "Save changes"}
                                    </Button>
                                </DialogFooter>
                            </form>
                        </DialogContent>
                    </Dialog>

                    {/* Add Meal Modal */}
                    <Dialog open={isMealOpen} onOpenChange={setIsMealOpen}>
                        <DialogTrigger asChild>
                            <Button className="w-full sm:w-auto">
                                <Plus className="w-4 h-4 mr-2" />
                                Add Meal
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
                            <DialogHeader>
                                <DialogTitle>Add a Meal</DialogTitle>
                                <DialogDescription>
                                    Log what you ate. Use the AI analyzer or enter data manually.
                                </DialogDescription>
                            </DialogHeader>
                            <form onSubmit={handleMealSubmit} className="space-y-6 mt-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>Meal Type</Label>
                                        <Select value={mealType} onValueChange={setMealType}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select type" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectGroup>
                                                    <SelectLabel>Meals</SelectLabel>
                                                    <SelectItem value="breakfast">Breakfast</SelectItem>
                                                    <SelectItem value="lunch">Lunch</SelectItem>
                                                    <SelectItem value="dinner">Dinner</SelectItem>
                                                    <SelectItem value="snacks">Snacks</SelectItem>
                                                </SelectGroup>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Date</Label>
                                        <Input type="date" value={mealDate} onChange={(e) => setMealDate(e.target.value)} required />
                                    </div>
                                </div>

                                <div className="bg-muted p-4 rounded-lg space-y-4">
                                    <div>
                                        <Label className="text-sm font-semibold mb-2 block">Magic AI Analysis</Label>
                                        <div className="flex flex-col sm:flex-row gap-2">
                                            <Input type="file" accept="image/*" onChange={handleImageUpload} className="bg-background cursor-pointer flex-1" />
                                            <Button type="button" variant="secondary" onClick={analyzeImage} disabled={isAnalyzing || !mealPhoto}>
                                                {isAnalyzing ? "Analyzing..." : "Analyze Photo"}
                                            </Button>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div className="flex justify-between items-center">
                                        <Label className="text-base font-semibold">Food Items</Label>
                                        <Button type="button" variant="outline" size="sm" onClick={addManualItem}>
                                            <Plus className="w-4 h-4 mr-1" /> Add Item Manually
                                        </Button>
                                    </div>

                                    {foodItems.map((item, index) => (
                                        <div key={index} className="p-4 border border-border rounded-lg relative bg-card">
                                            <button type="button" onClick={() => removeFoodItem(index)} className="absolute top-2 right-2 text-muted-foreground hover:text-destructive text-sm font-medium">Remove</button>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                                                <div className="space-y-2">
                                                    <Label>Food Name</Label>
                                                    <Input value={item.name} onChange={(e) => { const updated = [...foodItems]; updated[index].name = e.target.value; setFoodItems(updated); }} placeholder="e.g. Scrambled Eggs" required />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label>Quantity</Label>
                                                    <Input type="number" min="0.1" step="any" value={item.quantity} onChange={(e) => { const updated = [...foodItems]; updated[index].quantity = e.target.value; setFoodItems(updated); }} required />
                                                </div>
                                            </div>

                                            {/* Macronutrients */}
                                            <div className="grid grid-cols-4 gap-2 mt-4">
                                                <div className="space-y-2">
                                                    <Label className="text-xs">Calories</Label>
                                                    <Input type="number" min="0" value={item.calories} onChange={(e) => { const updated = [...foodItems]; updated[index].calories = e.target.value; setFoodItems(updated); }} />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label className="text-xs">Protein (g)</Label>
                                                    <Input type="number" min="0" value={item.protein} onChange={(e) => { const updated = [...foodItems]; updated[index].protein = e.target.value; setFoodItems(updated); }} />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label className="text-xs">Carbs (g)</Label>
                                                    <Input type="number" min="0" value={item.carbs} onChange={(e) => { const updated = [...foodItems]; updated[index].carbs = e.target.value; setFoodItems(updated); }} />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label className="text-xs">Fat (g)</Label>
                                                    <Input type="number" min="0" value={item.fat} onChange={(e) => { const updated = [...foodItems]; updated[index].fat = e.target.value; setFoodItems(updated); }} />
                                                </div>
                                            </div>

                                            {/* Vitamins & Minerals (Collapsed UI to save space) */}
                                            <div className="mt-4 pt-4 border-t border-border">
                                                <p className="text-xs font-semibold text-muted-foreground mb-2">Micronutrients (Optional)</p>
                                                <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
                                                    <div>
                                                        <Label className="text-xs">Vit A</Label>
                                                        <Input type="number" min="0" value={item.vitamins?.a || 0} onChange={(e) => { const updated = [...foodItems]; if (!updated[index].vitamins) updated[index].vitamins = { a: 0, c: 0, d: 0 }; updated[index].vitamins.a = e.target.value; setFoodItems(updated); }} />
                                                    </div>
                                                    <div>
                                                        <Label className="text-xs">Vit C</Label>
                                                        <Input type="number" min="0" value={item.vitamins?.c || 0} onChange={(e) => { const updated = [...foodItems]; if (!updated[index].vitamins) updated[index].vitamins = { a: 0, c: 0, d: 0 }; updated[index].vitamins.c = e.target.value; setFoodItems(updated); }} />
                                                    </div>
                                                    <div>
                                                        <Label className="text-xs">Vit D</Label>
                                                        <Input type="number" min="0" value={item.vitamins?.d || 0} onChange={(e) => { const updated = [...foodItems]; if (!updated[index].vitamins) updated[index].vitamins = { a: 0, c: 0, d: 0 }; updated[index].vitamins.d = e.target.value; setFoodItems(updated); }} />
                                                    </div>
                                                    <div>
                                                        <Label className="text-xs">Iron</Label>
                                                        <Input type="number" min="0" value={item.minerals?.iron || 0} onChange={(e) => { const updated = [...foodItems]; if (!updated[index].minerals) updated[index].minerals = { iron: 0, calcium: 0, magnesium: 0 }; updated[index].minerals.iron = e.target.value; setFoodItems(updated); }} />
                                                    </div>
                                                    <div>
                                                        <Label className="text-xs">Calcium</Label>
                                                        <Input type="number" min="0" value={item.minerals?.calcium || 0} onChange={(e) => { const updated = [...foodItems]; if (!updated[index].minerals) updated[index].minerals = { iron: 0, calcium: 0, magnesium: 0 }; updated[index].minerals.calcium = e.target.value; setFoodItems(updated); }} />
                                                    </div>
                                                    <div>
                                                        <Label className="text-xs">Magnesium</Label>
                                                        <Input type="number" min="0" value={item.minerals?.magnesium || 0} onChange={(e) => { const updated = [...foodItems]; if (!updated[index].minerals) updated[index].minerals = { iron: 0, calcium: 0, magnesium: 0 }; updated[index].minerals.magnesium = e.target.value; setFoodItems(updated); }} />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <DialogFooter>
                                    <Button type="submit" disabled={isSavingMeal || foodItems.length === 0} className="w-full">
                                        {isSavingMeal ? "Saving Meal..." : "Save Meal"}
                                    </Button>
                                </DialogFooter>
                            </form>
                        </DialogContent>
                    </Dialog>

                    <Button variant="outline" className="w-full sm:w-auto" onClick={handleLogout}>
                        Log Out
                    </Button>
                </div>
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Left Column: Line Chart + Meals */}
                <div className="lg:col-span-2 space-y-6">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-2 border-b border-border">
                            <div>
                                <CardTitle className="text-xl">Calorie Trend</CardTitle>
                                <CardDescription>Your caloric intake over the trailing 7 days</CardDescription>
                            </div>
                        </CardHeader>
                        <CardContent className="pt-6">
                            <div className="h-[300px] w-full flex items-center justify-center">
                                {lineChartData ? (
                                    <Line
                                        data={lineChartData}
                                        options={{
                                            responsive: true,
                                            maintainAspectRatio: false,
                                            plugins: { legend: { position: "top" } },
                                        }}
                                    />
                                ) : (
                                    <p className="text-muted-foreground text-sm">Not enough data to graph.</p>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-4 border-b border-border gap-4">
                            <CardTitle className="text-xl shrink-0">Food Log</CardTitle>
                            <div className="flex flex-wrap items-center gap-2">
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant={"outline"}
                                            className={cn(
                                                "w-[150px] justify-start text-left font-normal",
                                                !dateRange?.from && "text-muted-foreground"
                                            )}
                                        >
                                            <CalendarIcon className="mr-2 h-4 w-4" />
                                            {dateRange?.from ? format(dateRange.from, "LLL dd, y") : <span>Start Date</span>}
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0" align="start">
                                        <Calendar
                                            mode="single"
                                            selected={dateRange?.from}
                                            onSelect={(date) => {
                                                setDateRange(prev => ({ ...prev, from: date }));
                                                setPagination(prev => ({ ...prev, page: 1 }));
                                            }}
                                            initialFocus
                                        />
                                    </PopoverContent>
                                </Popover>

                                <span className="text-muted-foreground text-sm">to</span>

                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant={"outline"}
                                            className={cn(
                                                "w-[150px] justify-start text-left font-normal",
                                                !dateRange?.to && "text-muted-foreground"
                                            )}
                                        >
                                            <CalendarIcon className="mr-2 h-4 w-4" />
                                            {dateRange?.to ? format(dateRange.to, "LLL dd, y") : <span>End Date</span>}
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0" align="start">
                                        <Calendar
                                            mode="single"
                                            selected={dateRange?.to}
                                            onSelect={(date) => {
                                                setDateRange(prev => ({ ...prev, to: date }));
                                                setPagination(prev => ({ ...prev, page: 1 }));
                                            }}
                                            initialFocus
                                        />
                                    </PopoverContent>
                                </Popover>

                                {(dateRange?.from || dateRange?.to) && (
                                    <Button
                                        variant="ghost"
                                        className="h-9 px-3 text-muted-foreground hover:text-foreground"
                                        onClick={() => {
                                            setDateRange({ from: undefined, to: undefined });
                                            setPagination(prev => ({ ...prev, page: 1 }));
                                        }}
                                    >
                                        Clear
                                    </Button>
                                )}
                            </div>
                        </CardHeader>
                        <CardContent className="pt-6">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Food</TableHead>
                                        <TableHead>Date</TableHead>
                                        <TableHead>Type</TableHead>
                                        <TableHead className="text-right">Cal</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {paginatedFoodItems.length > 0 ? (
                                        paginatedFoodItems.map((item) => (
                                            <TableRow key={item._id}>
                                                <TableCell className="font-medium">{item.name}</TableCell>
                                                <TableCell>
                                                    {new Date(item.mealDetails.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                                                </TableCell>
                                                <TableCell className="capitalize text-muted-foreground">{item.mealDetails.mealType}</TableCell>
                                                <TableCell className="text-right font-semibold">{item.calories}</TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                                                No food items found matching criteria.
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>

                            {pagination.totalPages > 1 && (
                                <div className="mt-4 border-t border-border pt-4">
                                    <Pagination>
                                        <PaginationContent>
                                            <PaginationItem>
                                                <PaginationPrevious
                                                    onClick={() => setPagination(prev => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
                                                    className={pagination.page === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                                                />
                                            </PaginationItem>
                                            <PaginationItem>
                                                <span className="text-sm text-muted-foreground px-4">
                                                    Page {pagination.page} of {pagination.totalPages}
                                                </span>
                                            </PaginationItem>
                                            <PaginationItem>
                                                <PaginationNext
                                                    onClick={() => setPagination(prev => ({ ...prev, page: Math.min(prev.totalPages, prev.page + 1) }))}
                                                    className={pagination.page === pagination.totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                                                />
                                            </PaginationItem>
                                        </PaginationContent>
                                    </Pagination>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Right Column: Goal Summary & Doughnuts/Bars */}
                <div className="space-y-6">

                    <Card>
                        <CardHeader>
                            <CardTitle>Today's Summary</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                <div className="flex justify-between items-end">
                                    <div>
                                        <p className="text-sm font-medium text-muted-foreground mb-1">Calories Consumed</p>
                                        <div className="flex items-baseline gap-2">
                                            <span className="text-4xl font-black">{todayActuals.consumedCalories || 0}</span>
                                            <span className="text-sm text-muted-foreground font-medium">/ {dailyGoal.targetCalories || "-"} kcal</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-3 gap-2 pt-4 border-t border-border">
                                    <div className="text-center">
                                        <p className="text-xs text-muted-foreground font-medium">Protein</p>
                                        <p className="font-bold">{todayActuals.consumedProtein || 0}g</p>
                                        <p className="text-[10px] text-muted-foreground">Target: {dailyGoal.targetProtein || 0}g</p>
                                    </div>
                                    <div className="text-center border-l border-r border-border">
                                        <p className="text-xs text-muted-foreground font-medium">Carbs</p>
                                        <p className="font-bold">{todayActuals.consumedCarbs || 0}g</p>
                                        <p className="text-[10px] text-muted-foreground">Target: {dailyGoal.targetCarbs || 0}g</p>
                                    </div>
                                    <div className="text-center">
                                        <p className="text-xs text-muted-foreground font-medium">Fat</p>
                                        <p className="font-bold">{todayActuals.consumedFat || 0}g</p>
                                        <p className="text-[10px] text-muted-foreground">Target: {dailyGoal.targetFat || 0}g</p>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-2 border-b border-border">
                            <div>
                                <CardTitle className="text-lg">Macronutrients</CardTitle>
                                <CardDescription>{showMacroWeekly ? "Total Weekly Intake" : "Today"}</CardDescription>
                            </div>
                            <div className="flex items-center space-x-2">
                                <Label htmlFor="macro-toggle" className="text-xs">Weekly</Label>
                                <Switch id="macro-toggle" checked={showMacroWeekly} onCheckedChange={setShowMacroWeekly} />
                            </div>
                        </CardHeader>
                        <CardContent className="pt-6">
                            <div className="h-[200px] w-full flex items-center justify-center">
                                {pieChartData ? (
                                    <Doughnut data={pieChartData} options={{ responsive: true, maintainAspectRatio: false }} />
                                ) : (
                                    <p className="text-muted-foreground text-sm">Log meals to see data.</p>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-2 border-b border-border">
                            <div>
                                <CardTitle className="text-lg">Micronutrients</CardTitle>
                                <CardDescription>{showMicroWeekly ? "Total Weekly Intake" : "Today"}</CardDescription>
                            </div>
                            <div className="flex items-center space-x-2">
                                <Label htmlFor="micro-toggle" className="text-xs">Weekly</Label>
                                <Switch id="micro-toggle" checked={showMicroWeekly} onCheckedChange={setShowMicroWeekly} />
                            </div>
                        </CardHeader>
                        <CardContent className="pt-6">
                            <div className="h-[200px] w-full flex items-center justify-center">
                                {radarChartData ? (
                                    <Bar data={radarChartData} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } }} />
                                ) : (
                                    <p className="text-muted-foreground text-sm">Analyze food to see vitamins.</p>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                </div>
            </div>
        </div>
    );
}
