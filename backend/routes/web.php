<?php

use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

Route::get('/debug-db', function () {
    try {
        $tables = DB::select('SHOW TABLES');
        $tableNames = array_map(function ($t) {
            return array_values((array) $t)[0];
        }, $tables);

        $result = ['tables' => $tableNames];

        // Check ulasan table structure
        if (in_array('ulasan', $tableNames)) {
            $columns = DB::select('SHOW COLUMNS FROM ulasan');
            $result['ulasan_columns'] = array_map(function ($c) {
                return $c->Field;
            }, $columns);
        } else {
            $result['ulasan_columns'] = 'TABLE NOT FOUND';
        }

        // Check barang table structure
        if (in_array('barang', $tableNames)) {
            $columns = DB::select('SHOW COLUMNS FROM barang');
            $result['barang_columns'] = array_map(function ($c) {
                return $c->Field;
            }, $columns);
        }

        // Check migrations table
        if (in_array('migrations', $tableNames)) {
            $migrations = DB::table('migrations')->orderBy('id', 'desc')->limit(10)->get();
            $result['recent_migrations'] = $migrations;
        }

        return response()->json($result);
    } catch (\Exception $e) {
        return response()->json([
            'error' => $e->getMessage(),
        ], 500);
    }
});
