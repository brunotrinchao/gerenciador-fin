import {
    Utensils, Home, Car, HeartPulse, Gamepad2, BookOpen, Shirt, Zap,
    Wifi, Smartphone, Droplets, Lightbulb, Fuel, Dumbbell, Film, Music,
    Plane, Building, Pill, Stethoscope, Scissors, ShoppingCart, Coffee,
    Gift, Landmark, Shield, Wrench, Monitor, Hammer, Beer, Tag, Briefcase,
    Laptop, TrendingUp, TrendingDown, KeyRound, Star, RotateCcw, Wallet,
    CreditCard, PawPrint, MoreHorizontal, ShoppingBag, Bus, Train, Bike,
    PiggyBank, BarChart2, DollarSign, Banknote, Receipt, HeartHandshake,
    Baby, Flower2, Book, Leaf, Siren, Package,
    Tv, Headphones, Camera, Watch, Gem, CircleDollarSign, HandCoins,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export const CATEGORY_ICONS: Record<string, LucideIcon> = {
    // Alimentação
    'utensils':        Utensils,
    'shopping-cart':   ShoppingCart,
    'shopping-bag':    ShoppingBag,
    'coffee':          Coffee,
    'beer':            Beer,
    // Moradia
    'home':            Home,
    'building':        Building,
    'key-round':       KeyRound,
    'hammer':          Hammer,
    'wrench':          Wrench,
    // Transporte
    'car':             Car,
    'bus':             Bus,
    'train':           Train,
    'bike':            Bike,
    'plane':           Plane,
    'fuel':            Fuel,
    // Saúde
    'heart-pulse':     HeartPulse,
    'stethoscope':     Stethoscope,
    'pill':            Pill,
    'dumbbell':        Dumbbell,
    // Lazer / Entretenimento
    'gamepad-2':       Gamepad2,
    'film':            Film,
    'music':           Music,
    'camera':          Camera,
    'tv':              Tv,
    'headphones':      Headphones,
    // Educação
    'book-open':       BookOpen,
    'book':            Book,
    'laptop':          Laptop,
    // Vestuário / Beleza
    'shirt':           Shirt,
    'scissors':        Scissors,
    'watch':           Watch,
    'gem':             Gem,
    // Serviços / Utilities
    'zap':             Zap,
    'wifi':            Wifi,
    'smartphone':      Smartphone,
    'droplets':        Droplets,
    'lightbulb':       Lightbulb,
    'monitor':         Monitor,
    // Finanças
    'credit-card':     CreditCard,
    'landmark':        Landmark,
    'shield':          Shield,
    'hand-coins':      HandCoins,
    'piggy-bank':      PiggyBank,
    'bar-chart-2':     BarChart2,
    'trending-up':     TrendingUp,
    'trending-down':   TrendingDown,
    'dollar-sign':     DollarSign,
    'banknote':        Banknote,
    'circle-dollar':   CircleDollarSign,
    'receipt':         Receipt,
    // Receita / Trabalho
    'briefcase':       Briefcase,
    'wallet':          Wallet,
    'tag':             Tag,
    'star':            Star,
    'rotate-ccw':      RotateCcw,
    // Outros
    'paw-print':       PawPrint,
    'baby':            Baby,
    'flower-2':        Flower2,
    'leaf':            Leaf,
    'gift':            Gift,
    'heart-handshake': HeartHandshake,
    'siren':           Siren,
    'package':         Package,
    'more-horizontal': MoreHorizontal,
};

export const ICON_NAMES = Object.keys(CATEGORY_ICONS);
