--
-- PostgreSQL database dump
--

\restrict TgOaVOCf2EA2SAf1PlWm1ZNZ6MiWXFFW8FfbIr6ifl4jNqflGZ7E4i5OeG1mYfp

-- Dumped from database version 17.8 (a284a84)
-- Dumped by pg_dump version 17.9 (Ubuntu 17.9-1.pgdg24.04+1)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: admins; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.admins (
    id integer NOT NULL,
    name character varying(100) DEFAULT ''::character varying NOT NULL,
    account character varying(100) NOT NULL,
    password character varying(255) NOT NULL,
    avatar character varying(500) DEFAULT ''::character varying,
    role_name character varying(50) DEFAULT '管理员'::character varying,
    role_id integer DEFAULT 0,
    dept_name character varying(100) DEFAULT ''::character varying,
    dept_id integer DEFAULT 0,
    mobile character varying(20) DEFAULT ''::character varying,
    email character varying(100) DEFAULT ''::character varying,
    status integer DEFAULT 1,
    remark text DEFAULT ''::text,
    create_time timestamp without time zone DEFAULT now(),
    update_time timestamp without time zone DEFAULT now(),
    deleted_at timestamp without time zone
);


ALTER TABLE public.admins OWNER TO neondb_owner;

--
-- Name: admins_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.admins_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.admins_id_seq OWNER TO neondb_owner;

--
-- Name: admins_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.admins_id_seq OWNED BY public.admins.id;


--
-- Name: collect_receipt; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.collect_receipt (
    id integer NOT NULL,
    receipt_no character varying(100) DEFAULT ''::character varying,
    order_sn character varying(100) DEFAULT ''::character varying,
    customer_id integer DEFAULT 0,
    customer_name character varying(200) DEFAULT ''::character varying,
    contact_name character varying(100) DEFAULT ''::character varying,
    amount numeric(10,2) DEFAULT 0,
    receipt_date date,
    pay_type character varying(50) DEFAULT 'customer'::character varying,
    fund_id integer DEFAULT 0,
    fund_name character varying(100) DEFAULT ''::character varying,
    remark text DEFAULT ''::text,
    status integer DEFAULT 1,
    created_at timestamp without time zone DEFAULT now(),
    deleted_at timestamp without time zone
);


ALTER TABLE public.collect_receipt OWNER TO neondb_owner;

--
-- Name: collect_receipt_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.collect_receipt_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.collect_receipt_id_seq OWNER TO neondb_owner;

--
-- Name: collect_receipt_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.collect_receipt_id_seq OWNED BY public.collect_receipt.id;


--
-- Name: company_info; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.company_info (
    id integer NOT NULL,
    name character varying(200) DEFAULT ''::character varying,
    logo character varying(500) DEFAULT ''::character varying,
    address text DEFAULT ''::text,
    tel character varying(50) DEFAULT ''::character varying,
    email character varying(100) DEFAULT ''::character varying,
    remark text DEFAULT ''::text
);


ALTER TABLE public.company_info OWNER TO neondb_owner;

--
-- Name: company_info_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.company_info_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.company_info_id_seq OWNER TO neondb_owner;

--
-- Name: company_info_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.company_info_id_seq OWNED BY public.company_info.id;


--
-- Name: depts; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.depts (
    id integer NOT NULL,
    name character varying(100) NOT NULL,
    parent_id integer DEFAULT 0,
    sort integer DEFAULT 0,
    status integer DEFAULT 1,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.depts OWNER TO neondb_owner;

--
-- Name: depts_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.depts_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.depts_id_seq OWNER TO neondb_owner;

--
-- Name: depts_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.depts_id_seq OWNED BY public.depts.id;


--
-- Name: finance_costs; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.finance_costs (
    id integer NOT NULL,
    cost_no character varying(100) DEFAULT ''::character varying,
    name character varying(200) DEFAULT ''::character varying,
    amount numeric(10,2) DEFAULT 0,
    cost_date date,
    remark text DEFAULT ''::text,
    status integer DEFAULT 1,
    created_at timestamp without time zone DEFAULT now(),
    deleted_at timestamp without time zone
);


ALTER TABLE public.finance_costs OWNER TO neondb_owner;

--
-- Name: finance_costs_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.finance_costs_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.finance_costs_id_seq OWNER TO neondb_owner;

--
-- Name: finance_costs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.finance_costs_id_seq OWNED BY public.finance_costs.id;


--
-- Name: finance_expenses; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.finance_expenses (
    id integer NOT NULL,
    expense_no character varying(100) DEFAULT ''::character varying,
    name character varying(200) DEFAULT ''::character varying,
    amount numeric(10,2) DEFAULT 0,
    expense_date date,
    fund_id integer DEFAULT 0,
    fund_name character varying(100) DEFAULT ''::character varying,
    remark text DEFAULT ''::text,
    status integer DEFAULT 1,
    created_at timestamp without time zone DEFAULT now(),
    deleted_at timestamp without time zone
);


ALTER TABLE public.finance_expenses OWNER TO neondb_owner;

--
-- Name: finance_expenses_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.finance_expenses_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.finance_expenses_id_seq OWNER TO neondb_owner;

--
-- Name: finance_expenses_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.finance_expenses_id_seq OWNED BY public.finance_expenses.id;


--
-- Name: finance_funds; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.finance_funds (
    id integer NOT NULL,
    name character varying(100) NOT NULL,
    fund_type integer DEFAULT 1,
    balance numeric(10,2) DEFAULT 0,
    bank_name character varying(100) DEFAULT ''::character varying,
    bank_account character varying(100) DEFAULT ''::character varying,
    remark text DEFAULT ''::text,
    status integer DEFAULT 1,
    create_time timestamp without time zone DEFAULT now(),
    update_time timestamp without time zone DEFAULT now(),
    deleted_at timestamp without time zone
);


ALTER TABLE public.finance_funds OWNER TO neondb_owner;

--
-- Name: finance_funds_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.finance_funds_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.finance_funds_id_seq OWNER TO neondb_owner;

--
-- Name: finance_funds_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.finance_funds_id_seq OWNED BY public.finance_funds.id;


--
-- Name: finance_invoices; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.finance_invoices (
    id integer NOT NULL,
    invoice_no character varying(100) DEFAULT ''::character varying,
    customer_id integer DEFAULT 0,
    customer_name character varying(200) DEFAULT ''::character varying,
    amount numeric(10,2) DEFAULT 0,
    invoice_date date,
    type integer DEFAULT 1,
    remark text DEFAULT ''::text,
    status integer DEFAULT 1,
    created_at timestamp without time zone DEFAULT now(),
    deleted_at timestamp without time zone
);


ALTER TABLE public.finance_invoices OWNER TO neondb_owner;

--
-- Name: finance_invoices_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.finance_invoices_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.finance_invoices_id_seq OWNER TO neondb_owner;

--
-- Name: finance_invoices_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.finance_invoices_id_seq OWNED BY public.finance_invoices.id;


--
-- Name: finance_payable; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.finance_payable (
    id integer NOT NULL,
    supplier_id integer DEFAULT 0,
    supplier_name character varying(200) DEFAULT ''::character varying,
    order_sn character varying(100) DEFAULT ''::character varying,
    order_amount numeric(10,2) DEFAULT 0,
    paid_amount numeric(10,2) DEFAULT 0,
    un_pay_amount numeric(10,2) DEFAULT 0,
    due_date date,
    status integer DEFAULT 0,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.finance_payable OWNER TO neondb_owner;

--
-- Name: finance_payable_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.finance_payable_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.finance_payable_id_seq OWNER TO neondb_owner;

--
-- Name: finance_payable_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.finance_payable_id_seq OWNED BY public.finance_payable.id;


--
-- Name: finance_receivable; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.finance_receivable (
    id integer NOT NULL,
    customer_id integer DEFAULT 0,
    customer_name character varying(200) DEFAULT ''::character varying,
    order_sn character varying(100) DEFAULT ''::character varying,
    total_amount numeric(10,2) DEFAULT 0,
    paid_amount numeric(10,2) DEFAULT 0,
    un_pay_amount numeric(10,2) DEFAULT 0,
    due_date date,
    status integer DEFAULT 0,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.finance_receivable OWNER TO neondb_owner;

--
-- Name: finance_receivable_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.finance_receivable_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.finance_receivable_id_seq OWNER TO neondb_owner;

--
-- Name: finance_receivable_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.finance_receivable_id_seq OWNED BY public.finance_receivable.id;


--
-- Name: finance_statements; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.finance_statements (
    id integer NOT NULL,
    statement_no character varying(100) DEFAULT ''::character varying,
    customer_id integer DEFAULT 0,
    customer_name character varying(200) DEFAULT ''::character varying,
    amount numeric(10,2) DEFAULT 0,
    start_date date,
    end_date date,
    remark text DEFAULT ''::text,
    status integer DEFAULT 1,
    created_at timestamp without time zone DEFAULT now(),
    deleted_at timestamp without time zone
);


ALTER TABLE public.finance_statements OWNER TO neondb_owner;

--
-- Name: finance_statements_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.finance_statements_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.finance_statements_id_seq OWNER TO neondb_owner;

--
-- Name: finance_statements_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.finance_statements_id_seq OWNED BY public.finance_statements.id;


--
-- Name: goods; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.goods (
    id integer NOT NULL,
    name character varying(200) NOT NULL,
    code character varying(100) DEFAULT ''::character varying,
    cate_id integer DEFAULT 0,
    cate_name character varying(100) DEFAULT ''::character varying,
    unit_id integer DEFAULT 0,
    unit_name character varying(50) DEFAULT ''::character varying,
    brand_id integer DEFAULT 0,
    brand_name character varying(100) DEFAULT ''::character varying,
    spec text DEFAULT ''::text,
    price numeric(10,2) DEFAULT 0,
    cost numeric(10,2) DEFAULT 0,
    stock integer DEFAULT 0,
    min_stock integer DEFAULT 0,
    max_stock integer DEFAULT 0,
    remark text DEFAULT ''::text,
    status integer DEFAULT 1,
    images text DEFAULT ''::text,
    create_time timestamp without time zone DEFAULT now(),
    update_time timestamp without time zone DEFAULT now(),
    deleted_at timestamp without time zone
);


ALTER TABLE public.goods OWNER TO neondb_owner;

--
-- Name: goods_brand; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.goods_brand (
    id integer NOT NULL,
    name character varying(100) NOT NULL,
    status integer DEFAULT 1,
    create_time timestamp without time zone DEFAULT now()
);


ALTER TABLE public.goods_brand OWNER TO neondb_owner;

--
-- Name: goods_brand_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.goods_brand_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.goods_brand_id_seq OWNER TO neondb_owner;

--
-- Name: goods_brand_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.goods_brand_id_seq OWNED BY public.goods_brand.id;


--
-- Name: goods_cate; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.goods_cate (
    id integer NOT NULL,
    name character varying(100) NOT NULL,
    parent_id integer DEFAULT 0,
    sort integer DEFAULT 0,
    status integer DEFAULT 1,
    create_time timestamp without time zone DEFAULT now()
);


ALTER TABLE public.goods_cate OWNER TO neondb_owner;

--
-- Name: goods_cate_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.goods_cate_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.goods_cate_id_seq OWNER TO neondb_owner;

--
-- Name: goods_cate_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.goods_cate_id_seq OWNED BY public.goods_cate.id;


--
-- Name: goods_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.goods_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.goods_id_seq OWNER TO neondb_owner;

--
-- Name: goods_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.goods_id_seq OWNED BY public.goods.id;


--
-- Name: goods_spec; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.goods_spec (
    id integer NOT NULL,
    name character varying(100) NOT NULL,
    "values" text DEFAULT ''::text,
    status integer DEFAULT 1,
    create_time timestamp without time zone DEFAULT now()
);


ALTER TABLE public.goods_spec OWNER TO neondb_owner;

--
-- Name: goods_spec_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.goods_spec_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.goods_spec_id_seq OWNER TO neondb_owner;

--
-- Name: goods_spec_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.goods_spec_id_seq OWNED BY public.goods_spec.id;


--
-- Name: goods_unit; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.goods_unit (
    id integer NOT NULL,
    name character varying(50) NOT NULL,
    status integer DEFAULT 1,
    create_time timestamp without time zone DEFAULT now()
);


ALTER TABLE public.goods_unit OWNER TO neondb_owner;

--
-- Name: goods_unit_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.goods_unit_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.goods_unit_id_seq OWNER TO neondb_owner;

--
-- Name: goods_unit_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.goods_unit_id_seq OWNED BY public.goods_unit.id;


--
-- Name: jobs; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.jobs (
    id integer NOT NULL,
    name character varying(100) NOT NULL,
    dept_id integer DEFAULT 0,
    status integer DEFAULT 1,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.jobs OWNER TO neondb_owner;

--
-- Name: jobs_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.jobs_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.jobs_id_seq OWNER TO neondb_owner;

--
-- Name: jobs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.jobs_id_seq OWNED BY public.jobs.id;


--
-- Name: operation_logs; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.operation_logs (
    id integer NOT NULL,
    admin_id integer DEFAULT 0,
    admin_name character varying(100) DEFAULT ''::character varying,
    action character varying(200) DEFAULT ''::character varying,
    ip character varying(50) DEFAULT ''::character varying,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.operation_logs OWNER TO neondb_owner;

--
-- Name: operation_logs_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.operation_logs_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.operation_logs_id_seq OWNER TO neondb_owner;

--
-- Name: operation_logs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.operation_logs_id_seq OWNED BY public.operation_logs.id;


--
-- Name: pay_receipt; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.pay_receipt (
    id integer NOT NULL,
    receipt_no character varying(100) DEFAULT ''::character varying,
    order_sn character varying(100) DEFAULT ''::character varying,
    contact_type character varying(50) DEFAULT 'supplier'::character varying,
    contact_name character varying(200) DEFAULT ''::character varying,
    amount numeric(10,2) DEFAULT 0,
    pay_date date,
    fund_id integer DEFAULT 0,
    fund_name character varying(100) DEFAULT ''::character varying,
    remark text DEFAULT ''::text,
    status integer DEFAULT 1,
    created_at timestamp without time zone DEFAULT now(),
    deleted_at timestamp without time zone
);


ALTER TABLE public.pay_receipt OWNER TO neondb_owner;

--
-- Name: pay_receipt_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.pay_receipt_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.pay_receipt_id_seq OWNER TO neondb_owner;

--
-- Name: pay_receipt_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.pay_receipt_id_seq OWNED BY public.pay_receipt.id;


--
-- Name: prepay_record; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.prepay_record (
    id integer NOT NULL,
    order_sn character varying(100) DEFAULT ''::character varying,
    pay_type character varying(50) DEFAULT 'customer'::character varying,
    supplier_id integer DEFAULT 0,
    supplier_name character varying(200) DEFAULT ''::character varying,
    customer_id integer DEFAULT 0,
    customer_name character varying(200) DEFAULT ''::character varying,
    amount numeric(10,2) DEFAULT 0,
    pay_date date,
    fund_id integer DEFAULT 0,
    fund_name character varying(100) DEFAULT ''::character varying,
    admin_name character varying(100) DEFAULT ''::character varying,
    remark text DEFAULT ''::text,
    status integer DEFAULT 1,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.prepay_record OWNER TO neondb_owner;

--
-- Name: prepay_record_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.prepay_record_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.prepay_record_id_seq OWNER TO neondb_owner;

--
-- Name: prepay_record_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.prepay_record_id_seq OWNED BY public.prepay_record.id;


--
-- Name: procure_inhouse; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.procure_inhouse (
    id integer NOT NULL,
    order_no character varying(100) DEFAULT ''::character varying,
    purchase_order_id integer DEFAULT 0,
    supplier_id integer DEFAULT 0,
    supplier_name character varying(200) DEFAULT ''::character varying,
    admin_name character varying(100) DEFAULT ''::character varying,
    in_date date,
    goods_info jsonb DEFAULT '[]'::jsonb,
    remark text DEFAULT ''::text,
    status integer DEFAULT 0,
    warehouse_id integer DEFAULT 0,
    warehouse_name character varying(100) DEFAULT ''::character varying,
    created_at timestamp without time zone DEFAULT now(),
    deleted_at timestamp without time zone
);


ALTER TABLE public.procure_inhouse OWNER TO neondb_owner;

--
-- Name: procure_inhouse_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.procure_inhouse_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.procure_inhouse_id_seq OWNER TO neondb_owner;

--
-- Name: procure_inhouse_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.procure_inhouse_id_seq OWNED BY public.procure_inhouse.id;


--
-- Name: procure_plan; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.procure_plan (
    id integer NOT NULL,
    order_no character varying(100) DEFAULT ''::character varying,
    plan_date date,
    goods_info jsonb DEFAULT '[]'::jsonb,
    remark text DEFAULT ''::text,
    status integer DEFAULT 0,
    admin_name character varying(100) DEFAULT ''::character varying,
    created_at timestamp without time zone DEFAULT now(),
    deleted_at timestamp without time zone
);


ALTER TABLE public.procure_plan OWNER TO neondb_owner;

--
-- Name: procure_plan_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.procure_plan_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.procure_plan_id_seq OWNER TO neondb_owner;

--
-- Name: procure_plan_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.procure_plan_id_seq OWNED BY public.procure_plan.id;


--
-- Name: procure_return; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.procure_return (
    id integer NOT NULL,
    order_no character varying(100) DEFAULT ''::character varying,
    order_sn character varying(100) DEFAULT ''::character varying,
    order_id integer DEFAULT 0,
    supplier_id integer DEFAULT 0,
    supplier_name character varying(200) DEFAULT ''::character varying,
    admin_name character varying(100) DEFAULT ''::character varying,
    return_date date,
    total_amount numeric(10,2) DEFAULT 0,
    goods_info jsonb DEFAULT '[]'::jsonb,
    remark text DEFAULT ''::text,
    status integer DEFAULT 0,
    warehouse_id integer DEFAULT 0,
    warehouse_name character varying(100) DEFAULT ''::character varying,
    fund_id integer DEFAULT 0,
    created_at timestamp without time zone DEFAULT now(),
    deleted_at timestamp without time zone
);


ALTER TABLE public.procure_return OWNER TO neondb_owner;

--
-- Name: procure_return_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.procure_return_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.procure_return_id_seq OWNER TO neondb_owner;

--
-- Name: procure_return_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.procure_return_id_seq OWNED BY public.procure_return.id;


--
-- Name: purchase_order; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.purchase_order (
    id integer NOT NULL,
    order_no character varying(100) DEFAULT ''::character varying,
    order_sn character varying(100) DEFAULT ''::character varying,
    supplier_id integer DEFAULT 0,
    supplier_name character varying(200) DEFAULT ''::character varying,
    admin_name character varying(100) DEFAULT ''::character varying,
    order_date date,
    total_amount numeric(10,2) DEFAULT 0,
    pay_amount numeric(10,2) DEFAULT 0,
    freight_amount numeric(10,2) DEFAULT 0,
    goods_info jsonb DEFAULT '[]'::jsonb,
    remark text DEFAULT ''::text,
    status integer DEFAULT 0,
    warehouse_id integer DEFAULT 0,
    warehouse_name character varying(100) DEFAULT ''::character varying,
    fund_id integer DEFAULT 0,
    fund_name character varying(100) DEFAULT ''::character varying,
    created_at timestamp without time zone DEFAULT now(),
    deleted_at timestamp without time zone
);


ALTER TABLE public.purchase_order OWNER TO neondb_owner;

--
-- Name: purchase_order_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.purchase_order_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.purchase_order_id_seq OWNER TO neondb_owner;

--
-- Name: purchase_order_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.purchase_order_id_seq OWNED BY public.purchase_order.id;


--
-- Name: retail_members; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.retail_members (
    id integer NOT NULL,
    name character varying(100) DEFAULT ''::character varying,
    mobile character varying(20) DEFAULT ''::character varying,
    gender integer DEFAULT 0,
    birthday date,
    balance numeric(10,2) DEFAULT 0,
    points integer DEFAULT 0,
    level character varying(50) DEFAULT '普通会员'::character varying,
    remark text DEFAULT ''::text,
    status integer DEFAULT 1,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.retail_members OWNER TO neondb_owner;

--
-- Name: retail_members_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.retail_members_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.retail_members_id_seq OWNER TO neondb_owner;

--
-- Name: retail_members_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.retail_members_id_seq OWNED BY public.retail_members.id;


--
-- Name: retail_orders; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.retail_orders (
    id integer NOT NULL,
    order_sn character varying(100) DEFAULT ''::character varying,
    member_id integer DEFAULT 0,
    member_name character varying(100) DEFAULT ''::character varying,
    goods_info jsonb DEFAULT '[]'::jsonb,
    total_amount numeric(10,2) DEFAULT 0,
    pay_amount numeric(10,2) DEFAULT 0,
    pay_type character varying(50) DEFAULT ''::character varying,
    order_date date,
    remark text DEFAULT ''::text,
    status integer DEFAULT 1,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.retail_orders OWNER TO neondb_owner;

--
-- Name: retail_orders_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.retail_orders_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.retail_orders_id_seq OWNER TO neondb_owner;

--
-- Name: retail_orders_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.retail_orders_id_seq OWNED BY public.retail_orders.id;


--
-- Name: retail_recharge; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.retail_recharge (
    id integer NOT NULL,
    recharge_no character varying(100) DEFAULT ''::character varying,
    member_id integer DEFAULT 0,
    member_name character varying(100) DEFAULT ''::character varying,
    amount numeric(10,2) DEFAULT 0,
    fund_id integer DEFAULT 0,
    fund_name character varying(100) DEFAULT ''::character varying,
    remark text DEFAULT ''::text,
    status integer DEFAULT 1,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.retail_recharge OWNER TO neondb_owner;

--
-- Name: retail_recharge_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.retail_recharge_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.retail_recharge_id_seq OWNER TO neondb_owner;

--
-- Name: retail_recharge_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.retail_recharge_id_seq OWNED BY public.retail_recharge.id;


--
-- Name: roles; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.roles (
    id integer NOT NULL,
    name character varying(100) NOT NULL,
    permissions text DEFAULT ''::text,
    status integer DEFAULT 1,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.roles OWNER TO neondb_owner;

--
-- Name: roles_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.roles_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.roles_id_seq OWNER TO neondb_owner;

--
-- Name: roles_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.roles_id_seq OWNED BY public.roles.id;


--
-- Name: sale_contracts; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.sale_contracts (
    id integer NOT NULL,
    order_no character varying(100) DEFAULT ''::character varying,
    order_sn character varying(100) DEFAULT ''::character varying,
    customer_id integer DEFAULT 0,
    customer_name character varying(200) DEFAULT ''::character varying,
    admin_name character varying(100) DEFAULT ''::character varying,
    order_date date,
    total_amount numeric(10,2) DEFAULT 0,
    pay_amount numeric(10,2) DEFAULT 0,
    goods_info jsonb DEFAULT '[]'::jsonb,
    remark text DEFAULT ''::text,
    status integer DEFAULT 0,
    created_at timestamp without time zone DEFAULT now(),
    deleted_at timestamp without time zone
);


ALTER TABLE public.sale_contracts OWNER TO neondb_owner;

--
-- Name: sale_contracts_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.sale_contracts_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.sale_contracts_id_seq OWNER TO neondb_owner;

--
-- Name: sale_contracts_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.sale_contracts_id_seq OWNED BY public.sale_contracts.id;


--
-- Name: sale_customers; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.sale_customers (
    id integer NOT NULL,
    name character varying(200) DEFAULT ''::character varying NOT NULL,
    nickname character varying(100) DEFAULT ''::character varying,
    code character varying(100) DEFAULT ''::character varying,
    mobile character varying(20) DEFAULT ''::character varying,
    tel character varying(20) DEFAULT ''::character varying,
    email character varying(100) DEFAULT ''::character varying,
    address text DEFAULT ''::text,
    contact character varying(100) DEFAULT ''::character varying,
    level_name character varying(50) DEFAULT '普通客户'::character varying,
    source_name character varying(50) DEFAULT ''::character varying,
    level_id integer DEFAULT 0,
    source_id integer DEFAULT 0,
    follow_admin_id integer DEFAULT 0,
    follow_admin character varying(50) DEFAULT ''::character varying,
    balance numeric(10,2) DEFAULT 0,
    is_sea integer DEFAULT 0,
    remark text DEFAULT ''::text,
    status integer DEFAULT 1,
    create_time timestamp without time zone DEFAULT now(),
    update_time timestamp without time zone DEFAULT now(),
    deleted_at timestamp without time zone
);


ALTER TABLE public.sale_customers OWNER TO neondb_owner;

--
-- Name: sale_customers_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.sale_customers_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.sale_customers_id_seq OWNER TO neondb_owner;

--
-- Name: sale_customers_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.sale_customers_id_seq OWNED BY public.sale_customers.id;


--
-- Name: sale_offers; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.sale_offers (
    id integer NOT NULL,
    order_no character varying(100) DEFAULT ''::character varying,
    customer_id integer DEFAULT 0,
    customer_name character varying(200) DEFAULT ''::character varying,
    admin_name character varying(100) DEFAULT ''::character varying,
    offer_date date,
    total_amount numeric(10,2) DEFAULT 0,
    goods_info jsonb DEFAULT '[]'::jsonb,
    remark text DEFAULT ''::text,
    status integer DEFAULT 0,
    created_at timestamp without time zone DEFAULT now(),
    deleted_at timestamp without time zone
);


ALTER TABLE public.sale_offers OWNER TO neondb_owner;

--
-- Name: sale_offers_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.sale_offers_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.sale_offers_id_seq OWNER TO neondb_owner;

--
-- Name: sale_offers_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.sale_offers_id_seq OWNED BY public.sale_offers.id;


--
-- Name: sale_out_order; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.sale_out_order (
    id integer NOT NULL,
    order_no character varying(100) DEFAULT ''::character varying,
    order_sn character varying(100) DEFAULT ''::character varying,
    customer_id integer DEFAULT 0,
    customer_name character varying(200) DEFAULT ''::character varying,
    admin_name character varying(100) DEFAULT ''::character varying,
    out_date date,
    total_amount numeric(10,2) DEFAULT 0,
    goods_info jsonb DEFAULT '[]'::jsonb,
    remark text DEFAULT ''::text,
    status integer DEFAULT 0,
    warehouse_id integer DEFAULT 0,
    warehouse_name character varying(100) DEFAULT ''::character varying,
    created_at timestamp without time zone DEFAULT now(),
    deleted_at timestamp without time zone
);


ALTER TABLE public.sale_out_order OWNER TO neondb_owner;

--
-- Name: sale_out_order_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.sale_out_order_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.sale_out_order_id_seq OWNER TO neondb_owner;

--
-- Name: sale_out_order_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.sale_out_order_id_seq OWNED BY public.sale_out_order.id;


--
-- Name: sale_return_order; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.sale_return_order (
    id integer NOT NULL,
    order_no character varying(100) DEFAULT ''::character varying,
    customer_id integer DEFAULT 0,
    customer_name character varying(200) DEFAULT ''::character varying,
    return_date date,
    goods_info jsonb DEFAULT '[]'::jsonb,
    remark text DEFAULT ''::text,
    status integer DEFAULT 0,
    created_at timestamp without time zone DEFAULT now(),
    deleted_at timestamp without time zone
);


ALTER TABLE public.sale_return_order OWNER TO neondb_owner;

--
-- Name: sale_return_order_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.sale_return_order_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.sale_return_order_id_seq OWNER TO neondb_owner;

--
-- Name: sale_return_order_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.sale_return_order_id_seq OWNED BY public.sale_return_order.id;


--
-- Name: staff; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.staff (
    id integer NOT NULL,
    name character varying(100) NOT NULL,
    code character varying(50) DEFAULT ''::character varying,
    mobile character varying(20) DEFAULT ''::character varying,
    email character varying(100) DEFAULT ''::character varying,
    dept_id integer DEFAULT 0,
    dept_name character varying(100) DEFAULT ''::character varying,
    job_id integer DEFAULT 0,
    job_name character varying(100) DEFAULT ''::character varying,
    entry_date date,
    gender integer DEFAULT 1,
    status integer DEFAULT 1,
    remark text DEFAULT ''::text,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.staff OWNER TO neondb_owner;

--
-- Name: staff_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.staff_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.staff_id_seq OWNER TO neondb_owner;

--
-- Name: staff_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.staff_id_seq OWNED BY public.staff.id;


--
-- Name: stock_checks; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.stock_checks (
    id integer NOT NULL,
    order_no character varying(100) DEFAULT ''::character varying,
    warehouse_id integer DEFAULT 0,
    warehouse_name character varying(100) DEFAULT ''::character varying,
    goods_info jsonb DEFAULT '[]'::jsonb,
    remark text DEFAULT ''::text,
    status integer DEFAULT 0,
    admin_name character varying(100) DEFAULT ''::character varying,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.stock_checks OWNER TO neondb_owner;

--
-- Name: stock_checks_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.stock_checks_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.stock_checks_id_seq OWNER TO neondb_owner;

--
-- Name: stock_checks_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.stock_checks_id_seq OWNED BY public.stock_checks.id;


--
-- Name: stock_flow; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.stock_flow (
    id integer NOT NULL,
    goods_id integer DEFAULT 0,
    goods_name character varying(200) DEFAULT ''::character varying,
    warehouse_id integer DEFAULT 0,
    warehouse_name character varying(100) DEFAULT ''::character varying,
    type character varying(50) DEFAULT ''::character varying,
    qty integer DEFAULT 0,
    before_qty integer DEFAULT 0,
    after_qty integer DEFAULT 0,
    order_no character varying(100) DEFAULT ''::character varying,
    remark text DEFAULT ''::text,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.stock_flow OWNER TO neondb_owner;

--
-- Name: stock_flow_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.stock_flow_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.stock_flow_id_seq OWNER TO neondb_owner;

--
-- Name: stock_flow_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.stock_flow_id_seq OWNED BY public.stock_flow.id;


--
-- Name: stock_inventory; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.stock_inventory (
    id integer NOT NULL,
    goods_id integer DEFAULT 0,
    goods_name character varying(200) DEFAULT ''::character varying,
    goods_code character varying(100) DEFAULT ''::character varying,
    unit_name character varying(50) DEFAULT ''::character varying,
    warehouse_id integer DEFAULT 0,
    warehouse_name character varying(100) DEFAULT ''::character varying,
    qty integer DEFAULT 0,
    cost numeric(10,2) DEFAULT 0,
    update_time timestamp without time zone DEFAULT now()
);


ALTER TABLE public.stock_inventory OWNER TO neondb_owner;

--
-- Name: stock_inventory_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.stock_inventory_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.stock_inventory_id_seq OWNER TO neondb_owner;

--
-- Name: stock_inventory_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.stock_inventory_id_seq OWNED BY public.stock_inventory.id;


--
-- Name: stock_other_in; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.stock_other_in (
    id integer NOT NULL,
    order_no character varying(100) DEFAULT ''::character varying,
    warehouse_id integer DEFAULT 0,
    warehouse_name character varying(100) DEFAULT ''::character varying,
    goods_info jsonb DEFAULT '[]'::jsonb,
    remark text DEFAULT ''::text,
    status integer DEFAULT 0,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.stock_other_in OWNER TO neondb_owner;

--
-- Name: stock_other_in_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.stock_other_in_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.stock_other_in_id_seq OWNER TO neondb_owner;

--
-- Name: stock_other_in_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.stock_other_in_id_seq OWNED BY public.stock_other_in.id;


--
-- Name: stock_other_out; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.stock_other_out (
    id integer NOT NULL,
    order_no character varying(100) DEFAULT ''::character varying,
    warehouse_id integer DEFAULT 0,
    warehouse_name character varying(100) DEFAULT ''::character varying,
    goods_info jsonb DEFAULT '[]'::jsonb,
    remark text DEFAULT ''::text,
    status integer DEFAULT 0,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.stock_other_out OWNER TO neondb_owner;

--
-- Name: stock_other_out_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.stock_other_out_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.stock_other_out_id_seq OWNER TO neondb_owner;

--
-- Name: stock_other_out_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.stock_other_out_id_seq OWNED BY public.stock_other_out.id;


--
-- Name: supplier; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.supplier (
    id integer NOT NULL,
    name character varying(200) NOT NULL,
    contact character varying(100) DEFAULT ''::character varying,
    mobile character varying(20) DEFAULT ''::character varying,
    email character varying(100) DEFAULT ''::character varying,
    address text DEFAULT ''::text,
    bank character varying(100) DEFAULT ''::character varying,
    bank_account character varying(100) DEFAULT ''::character varying,
    remark text DEFAULT ''::text,
    status integer DEFAULT 1,
    create_time timestamp without time zone DEFAULT now(),
    update_time timestamp without time zone DEFAULT now(),
    deleted_at timestamp without time zone
);


ALTER TABLE public.supplier OWNER TO neondb_owner;

--
-- Name: supplier_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.supplier_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.supplier_id_seq OWNER TO neondb_owner;

--
-- Name: supplier_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.supplier_id_seq OWNED BY public.supplier.id;


--
-- Name: sys_params; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.sys_params (
    id integer NOT NULL,
    key character varying(100),
    value text DEFAULT ''::text,
    remark text DEFAULT ''::text
);


ALTER TABLE public.sys_params OWNER TO neondb_owner;

--
-- Name: sys_params_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.sys_params_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.sys_params_id_seq OWNER TO neondb_owner;

--
-- Name: sys_params_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.sys_params_id_seq OWNED BY public.sys_params.id;


--
-- Name: warehouses; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public.warehouses (
    id integer NOT NULL,
    name character varying(100) NOT NULL,
    address text DEFAULT ''::text,
    remark text DEFAULT ''::text,
    status integer DEFAULT 1,
    create_time timestamp without time zone DEFAULT now()
);


ALTER TABLE public.warehouses OWNER TO neondb_owner;

--
-- Name: warehouses_id_seq; Type: SEQUENCE; Schema: public; Owner: neondb_owner
--

CREATE SEQUENCE public.warehouses_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.warehouses_id_seq OWNER TO neondb_owner;

--
-- Name: warehouses_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: neondb_owner
--

ALTER SEQUENCE public.warehouses_id_seq OWNED BY public.warehouses.id;


--
-- Name: admins id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.admins ALTER COLUMN id SET DEFAULT nextval('public.admins_id_seq'::regclass);


--
-- Name: collect_receipt id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.collect_receipt ALTER COLUMN id SET DEFAULT nextval('public.collect_receipt_id_seq'::regclass);


--
-- Name: company_info id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.company_info ALTER COLUMN id SET DEFAULT nextval('public.company_info_id_seq'::regclass);


--
-- Name: depts id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.depts ALTER COLUMN id SET DEFAULT nextval('public.depts_id_seq'::regclass);


--
-- Name: finance_costs id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.finance_costs ALTER COLUMN id SET DEFAULT nextval('public.finance_costs_id_seq'::regclass);


--
-- Name: finance_expenses id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.finance_expenses ALTER COLUMN id SET DEFAULT nextval('public.finance_expenses_id_seq'::regclass);


--
-- Name: finance_funds id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.finance_funds ALTER COLUMN id SET DEFAULT nextval('public.finance_funds_id_seq'::regclass);


--
-- Name: finance_invoices id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.finance_invoices ALTER COLUMN id SET DEFAULT nextval('public.finance_invoices_id_seq'::regclass);


--
-- Name: finance_payable id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.finance_payable ALTER COLUMN id SET DEFAULT nextval('public.finance_payable_id_seq'::regclass);


--
-- Name: finance_receivable id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.finance_receivable ALTER COLUMN id SET DEFAULT nextval('public.finance_receivable_id_seq'::regclass);


--
-- Name: finance_statements id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.finance_statements ALTER COLUMN id SET DEFAULT nextval('public.finance_statements_id_seq'::regclass);


--
-- Name: goods id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.goods ALTER COLUMN id SET DEFAULT nextval('public.goods_id_seq'::regclass);


--
-- Name: goods_brand id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.goods_brand ALTER COLUMN id SET DEFAULT nextval('public.goods_brand_id_seq'::regclass);


--
-- Name: goods_cate id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.goods_cate ALTER COLUMN id SET DEFAULT nextval('public.goods_cate_id_seq'::regclass);


--
-- Name: goods_spec id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.goods_spec ALTER COLUMN id SET DEFAULT nextval('public.goods_spec_id_seq'::regclass);


--
-- Name: goods_unit id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.goods_unit ALTER COLUMN id SET DEFAULT nextval('public.goods_unit_id_seq'::regclass);


--
-- Name: jobs id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.jobs ALTER COLUMN id SET DEFAULT nextval('public.jobs_id_seq'::regclass);


--
-- Name: operation_logs id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.operation_logs ALTER COLUMN id SET DEFAULT nextval('public.operation_logs_id_seq'::regclass);


--
-- Name: pay_receipt id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.pay_receipt ALTER COLUMN id SET DEFAULT nextval('public.pay_receipt_id_seq'::regclass);


--
-- Name: prepay_record id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.prepay_record ALTER COLUMN id SET DEFAULT nextval('public.prepay_record_id_seq'::regclass);


--
-- Name: procure_inhouse id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.procure_inhouse ALTER COLUMN id SET DEFAULT nextval('public.procure_inhouse_id_seq'::regclass);


--
-- Name: procure_plan id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.procure_plan ALTER COLUMN id SET DEFAULT nextval('public.procure_plan_id_seq'::regclass);


--
-- Name: procure_return id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.procure_return ALTER COLUMN id SET DEFAULT nextval('public.procure_return_id_seq'::regclass);


--
-- Name: purchase_order id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.purchase_order ALTER COLUMN id SET DEFAULT nextval('public.purchase_order_id_seq'::regclass);


--
-- Name: retail_members id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.retail_members ALTER COLUMN id SET DEFAULT nextval('public.retail_members_id_seq'::regclass);


--
-- Name: retail_orders id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.retail_orders ALTER COLUMN id SET DEFAULT nextval('public.retail_orders_id_seq'::regclass);


--
-- Name: retail_recharge id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.retail_recharge ALTER COLUMN id SET DEFAULT nextval('public.retail_recharge_id_seq'::regclass);


--
-- Name: roles id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.roles ALTER COLUMN id SET DEFAULT nextval('public.roles_id_seq'::regclass);


--
-- Name: sale_contracts id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.sale_contracts ALTER COLUMN id SET DEFAULT nextval('public.sale_contracts_id_seq'::regclass);


--
-- Name: sale_customers id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.sale_customers ALTER COLUMN id SET DEFAULT nextval('public.sale_customers_id_seq'::regclass);


--
-- Name: sale_offers id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.sale_offers ALTER COLUMN id SET DEFAULT nextval('public.sale_offers_id_seq'::regclass);


--
-- Name: sale_out_order id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.sale_out_order ALTER COLUMN id SET DEFAULT nextval('public.sale_out_order_id_seq'::regclass);


--
-- Name: sale_return_order id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.sale_return_order ALTER COLUMN id SET DEFAULT nextval('public.sale_return_order_id_seq'::regclass);


--
-- Name: staff id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.staff ALTER COLUMN id SET DEFAULT nextval('public.staff_id_seq'::regclass);


--
-- Name: stock_checks id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.stock_checks ALTER COLUMN id SET DEFAULT nextval('public.stock_checks_id_seq'::regclass);


--
-- Name: stock_flow id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.stock_flow ALTER COLUMN id SET DEFAULT nextval('public.stock_flow_id_seq'::regclass);


--
-- Name: stock_inventory id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.stock_inventory ALTER COLUMN id SET DEFAULT nextval('public.stock_inventory_id_seq'::regclass);


--
-- Name: stock_other_in id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.stock_other_in ALTER COLUMN id SET DEFAULT nextval('public.stock_other_in_id_seq'::regclass);


--
-- Name: stock_other_out id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.stock_other_out ALTER COLUMN id SET DEFAULT nextval('public.stock_other_out_id_seq'::regclass);


--
-- Name: supplier id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.supplier ALTER COLUMN id SET DEFAULT nextval('public.supplier_id_seq'::regclass);


--
-- Name: sys_params id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.sys_params ALTER COLUMN id SET DEFAULT nextval('public.sys_params_id_seq'::regclass);


--
-- Name: warehouses id; Type: DEFAULT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.warehouses ALTER COLUMN id SET DEFAULT nextval('public.warehouses_id_seq'::regclass);


--
-- Data for Name: admins; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.admins (id, name, account, password, avatar, role_name, role_id, dept_name, dept_id, mobile, email, status, remark, create_time, update_time, deleted_at) FROM stdin;
1	管理员	17747344571	Oral6421		超级管理员	0		0			1		2026-03-28 12:40:01.408684	2026-03-28 12:40:01.408684	\N
2	管理员	admin	123456		超级管理员	0		0			1		2026-03-28 13:04:00.311975	2026-03-28 13:04:00.311975	\N
\.


--
-- Data for Name: collect_receipt; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.collect_receipt (id, receipt_no, order_sn, customer_id, customer_name, contact_name, amount, receipt_date, pay_type, fund_id, fund_name, remark, status, created_at, deleted_at) FROM stdin;
\.


--
-- Data for Name: company_info; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.company_info (id, name, logo, address, tel, email, remark) FROM stdin;
1	我的公司					
\.


--
-- Data for Name: depts; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.depts (id, name, parent_id, sort, status, created_at) FROM stdin;
\.


--
-- Data for Name: finance_costs; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.finance_costs (id, cost_no, name, amount, cost_date, remark, status, created_at, deleted_at) FROM stdin;
\.


--
-- Data for Name: finance_expenses; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.finance_expenses (id, expense_no, name, amount, expense_date, fund_id, fund_name, remark, status, created_at, deleted_at) FROM stdin;
\.


--
-- Data for Name: finance_funds; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.finance_funds (id, name, fund_type, balance, bank_name, bank_account, remark, status, create_time, update_time, deleted_at) FROM stdin;
\.


--
-- Data for Name: finance_invoices; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.finance_invoices (id, invoice_no, customer_id, customer_name, amount, invoice_date, type, remark, status, created_at, deleted_at) FROM stdin;
\.


--
-- Data for Name: finance_payable; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.finance_payable (id, supplier_id, supplier_name, order_sn, order_amount, paid_amount, un_pay_amount, due_date, status, created_at) FROM stdin;
\.


--
-- Data for Name: finance_receivable; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.finance_receivable (id, customer_id, customer_name, order_sn, total_amount, paid_amount, un_pay_amount, due_date, status, created_at) FROM stdin;
\.


--
-- Data for Name: finance_statements; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.finance_statements (id, statement_no, customer_id, customer_name, amount, start_date, end_date, remark, status, created_at, deleted_at) FROM stdin;
\.


--
-- Data for Name: goods; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.goods (id, name, code, cate_id, cate_name, unit_id, unit_name, brand_id, brand_name, spec, price, cost, stock, min_stock, max_stock, remark, status, images, create_time, update_time, deleted_at) FROM stdin;
\.


--
-- Data for Name: goods_brand; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.goods_brand (id, name, status, create_time) FROM stdin;
\.


--
-- Data for Name: goods_cate; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.goods_cate (id, name, parent_id, sort, status, create_time) FROM stdin;
\.


--
-- Data for Name: goods_spec; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.goods_spec (id, name, "values", status, create_time) FROM stdin;
\.


--
-- Data for Name: goods_unit; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.goods_unit (id, name, status, create_time) FROM stdin;
\.


--
-- Data for Name: jobs; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.jobs (id, name, dept_id, status, created_at) FROM stdin;
\.


--
-- Data for Name: operation_logs; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.operation_logs (id, admin_id, admin_name, action, ip, created_at) FROM stdin;
\.


--
-- Data for Name: pay_receipt; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.pay_receipt (id, receipt_no, order_sn, contact_type, contact_name, amount, pay_date, fund_id, fund_name, remark, status, created_at, deleted_at) FROM stdin;
\.


--
-- Data for Name: prepay_record; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.prepay_record (id, order_sn, pay_type, supplier_id, supplier_name, customer_id, customer_name, amount, pay_date, fund_id, fund_name, admin_name, remark, status, created_at) FROM stdin;
\.


--
-- Data for Name: procure_inhouse; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.procure_inhouse (id, order_no, purchase_order_id, supplier_id, supplier_name, admin_name, in_date, goods_info, remark, status, warehouse_id, warehouse_name, created_at, deleted_at) FROM stdin;
\.


--
-- Data for Name: procure_plan; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.procure_plan (id, order_no, plan_date, goods_info, remark, status, admin_name, created_at, deleted_at) FROM stdin;
\.


--
-- Data for Name: procure_return; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.procure_return (id, order_no, order_sn, order_id, supplier_id, supplier_name, admin_name, return_date, total_amount, goods_info, remark, status, warehouse_id, warehouse_name, fund_id, created_at, deleted_at) FROM stdin;
\.


--
-- Data for Name: purchase_order; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.purchase_order (id, order_no, order_sn, supplier_id, supplier_name, admin_name, order_date, total_amount, pay_amount, freight_amount, goods_info, remark, status, warehouse_id, warehouse_name, fund_id, fund_name, created_at, deleted_at) FROM stdin;
\.


--
-- Data for Name: retail_members; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.retail_members (id, name, mobile, gender, birthday, balance, points, level, remark, status, created_at) FROM stdin;
\.


--
-- Data for Name: retail_orders; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.retail_orders (id, order_sn, member_id, member_name, goods_info, total_amount, pay_amount, pay_type, order_date, remark, status, created_at) FROM stdin;
\.


--
-- Data for Name: retail_recharge; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.retail_recharge (id, recharge_no, member_id, member_name, amount, fund_id, fund_name, remark, status, created_at) FROM stdin;
\.


--
-- Data for Name: roles; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.roles (id, name, permissions, status, created_at) FROM stdin;
\.


--
-- Data for Name: sale_contracts; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.sale_contracts (id, order_no, order_sn, customer_id, customer_name, admin_name, order_date, total_amount, pay_amount, goods_info, remark, status, created_at, deleted_at) FROM stdin;
\.


--
-- Data for Name: sale_customers; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.sale_customers (id, name, nickname, code, mobile, tel, email, address, contact, level_name, source_name, level_id, source_id, follow_admin_id, follow_admin, balance, is_sea, remark, status, create_time, update_time, deleted_at) FROM stdin;
\.


--
-- Data for Name: sale_offers; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.sale_offers (id, order_no, customer_id, customer_name, admin_name, offer_date, total_amount, goods_info, remark, status, created_at, deleted_at) FROM stdin;
\.


--
-- Data for Name: sale_out_order; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.sale_out_order (id, order_no, order_sn, customer_id, customer_name, admin_name, out_date, total_amount, goods_info, remark, status, warehouse_id, warehouse_name, created_at, deleted_at) FROM stdin;
\.


--
-- Data for Name: sale_return_order; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.sale_return_order (id, order_no, customer_id, customer_name, return_date, goods_info, remark, status, created_at, deleted_at) FROM stdin;
\.


--
-- Data for Name: staff; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.staff (id, name, code, mobile, email, dept_id, dept_name, job_id, job_name, entry_date, gender, status, remark, created_at) FROM stdin;
\.


--
-- Data for Name: stock_checks; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.stock_checks (id, order_no, warehouse_id, warehouse_name, goods_info, remark, status, admin_name, created_at) FROM stdin;
\.


--
-- Data for Name: stock_flow; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.stock_flow (id, goods_id, goods_name, warehouse_id, warehouse_name, type, qty, before_qty, after_qty, order_no, remark, created_at) FROM stdin;
\.


--
-- Data for Name: stock_inventory; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.stock_inventory (id, goods_id, goods_name, goods_code, unit_name, warehouse_id, warehouse_name, qty, cost, update_time) FROM stdin;
\.


--
-- Data for Name: stock_other_in; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.stock_other_in (id, order_no, warehouse_id, warehouse_name, goods_info, remark, status, created_at) FROM stdin;
\.


--
-- Data for Name: stock_other_out; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.stock_other_out (id, order_no, warehouse_id, warehouse_name, goods_info, remark, status, created_at) FROM stdin;
\.


--
-- Data for Name: supplier; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.supplier (id, name, contact, mobile, email, address, bank, bank_account, remark, status, create_time, update_time, deleted_at) FROM stdin;
\.


--
-- Data for Name: sys_params; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.sys_params (id, key, value, remark) FROM stdin;
\.


--
-- Data for Name: warehouses; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

COPY public.warehouses (id, name, address, remark, status, create_time) FROM stdin;
1	默认仓库			1	2026-03-28 12:40:01.297668
2	默认仓库			1	2026-03-28 13:04:00.311975
3	默认仓库			1	2026-03-28 15:27:33.970328
\.


--
-- Name: admins_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.admins_id_seq', 3, true);


--
-- Name: collect_receipt_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.collect_receipt_id_seq', 1, false);


--
-- Name: company_info_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.company_info_id_seq', 1, true);


--
-- Name: depts_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.depts_id_seq', 1, false);


--
-- Name: finance_costs_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.finance_costs_id_seq', 1, false);


--
-- Name: finance_expenses_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.finance_expenses_id_seq', 1, false);


--
-- Name: finance_funds_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.finance_funds_id_seq', 1, false);


--
-- Name: finance_invoices_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.finance_invoices_id_seq', 1, false);


--
-- Name: finance_payable_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.finance_payable_id_seq', 1, false);


--
-- Name: finance_receivable_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.finance_receivable_id_seq', 1, false);


--
-- Name: finance_statements_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.finance_statements_id_seq', 1, false);


--
-- Name: goods_brand_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.goods_brand_id_seq', 1, false);


--
-- Name: goods_cate_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.goods_cate_id_seq', 1, false);


--
-- Name: goods_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.goods_id_seq', 1, false);


--
-- Name: goods_spec_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.goods_spec_id_seq', 1, false);


--
-- Name: goods_unit_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.goods_unit_id_seq', 1, false);


--
-- Name: jobs_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.jobs_id_seq', 1, false);


--
-- Name: operation_logs_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.operation_logs_id_seq', 1, false);


--
-- Name: pay_receipt_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.pay_receipt_id_seq', 1, false);


--
-- Name: prepay_record_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.prepay_record_id_seq', 1, false);


--
-- Name: procure_inhouse_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.procure_inhouse_id_seq', 1, false);


--
-- Name: procure_plan_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.procure_plan_id_seq', 1, false);


--
-- Name: procure_return_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.procure_return_id_seq', 1, false);


--
-- Name: purchase_order_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.purchase_order_id_seq', 1, false);


--
-- Name: retail_members_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.retail_members_id_seq', 1, false);


--
-- Name: retail_orders_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.retail_orders_id_seq', 1, false);


--
-- Name: retail_recharge_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.retail_recharge_id_seq', 1, false);


--
-- Name: roles_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.roles_id_seq', 1, false);


--
-- Name: sale_contracts_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.sale_contracts_id_seq', 1, false);


--
-- Name: sale_customers_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.sale_customers_id_seq', 1, false);


--
-- Name: sale_offers_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.sale_offers_id_seq', 1, false);


--
-- Name: sale_out_order_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.sale_out_order_id_seq', 1, false);


--
-- Name: sale_return_order_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.sale_return_order_id_seq', 1, false);


--
-- Name: staff_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.staff_id_seq', 1, false);


--
-- Name: stock_checks_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.stock_checks_id_seq', 1, false);


--
-- Name: stock_flow_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.stock_flow_id_seq', 1, false);


--
-- Name: stock_inventory_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.stock_inventory_id_seq', 1, false);


--
-- Name: stock_other_in_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.stock_other_in_id_seq', 1, false);


--
-- Name: stock_other_out_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.stock_other_out_id_seq', 1, false);


--
-- Name: supplier_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.supplier_id_seq', 1, false);


--
-- Name: sys_params_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.sys_params_id_seq', 1, false);


--
-- Name: warehouses_id_seq; Type: SEQUENCE SET; Schema: public; Owner: neondb_owner
--

SELECT pg_catalog.setval('public.warehouses_id_seq', 3, true);


--
-- Name: admins admins_account_key; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.admins
    ADD CONSTRAINT admins_account_key UNIQUE (account);


--
-- Name: admins admins_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.admins
    ADD CONSTRAINT admins_pkey PRIMARY KEY (id);


--
-- Name: collect_receipt collect_receipt_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.collect_receipt
    ADD CONSTRAINT collect_receipt_pkey PRIMARY KEY (id);


--
-- Name: company_info company_info_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.company_info
    ADD CONSTRAINT company_info_pkey PRIMARY KEY (id);


--
-- Name: depts depts_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.depts
    ADD CONSTRAINT depts_pkey PRIMARY KEY (id);


--
-- Name: finance_costs finance_costs_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.finance_costs
    ADD CONSTRAINT finance_costs_pkey PRIMARY KEY (id);


--
-- Name: finance_expenses finance_expenses_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.finance_expenses
    ADD CONSTRAINT finance_expenses_pkey PRIMARY KEY (id);


--
-- Name: finance_funds finance_funds_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.finance_funds
    ADD CONSTRAINT finance_funds_pkey PRIMARY KEY (id);


--
-- Name: finance_invoices finance_invoices_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.finance_invoices
    ADD CONSTRAINT finance_invoices_pkey PRIMARY KEY (id);


--
-- Name: finance_payable finance_payable_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.finance_payable
    ADD CONSTRAINT finance_payable_pkey PRIMARY KEY (id);


--
-- Name: finance_receivable finance_receivable_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.finance_receivable
    ADD CONSTRAINT finance_receivable_pkey PRIMARY KEY (id);


--
-- Name: finance_statements finance_statements_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.finance_statements
    ADD CONSTRAINT finance_statements_pkey PRIMARY KEY (id);


--
-- Name: goods_brand goods_brand_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.goods_brand
    ADD CONSTRAINT goods_brand_pkey PRIMARY KEY (id);


--
-- Name: goods_cate goods_cate_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.goods_cate
    ADD CONSTRAINT goods_cate_pkey PRIMARY KEY (id);


--
-- Name: goods goods_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.goods
    ADD CONSTRAINT goods_pkey PRIMARY KEY (id);


--
-- Name: goods_spec goods_spec_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.goods_spec
    ADD CONSTRAINT goods_spec_pkey PRIMARY KEY (id);


--
-- Name: goods_unit goods_unit_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.goods_unit
    ADD CONSTRAINT goods_unit_pkey PRIMARY KEY (id);


--
-- Name: jobs jobs_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.jobs
    ADD CONSTRAINT jobs_pkey PRIMARY KEY (id);


--
-- Name: operation_logs operation_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.operation_logs
    ADD CONSTRAINT operation_logs_pkey PRIMARY KEY (id);


--
-- Name: pay_receipt pay_receipt_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.pay_receipt
    ADD CONSTRAINT pay_receipt_pkey PRIMARY KEY (id);


--
-- Name: prepay_record prepay_record_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.prepay_record
    ADD CONSTRAINT prepay_record_pkey PRIMARY KEY (id);


--
-- Name: procure_inhouse procure_inhouse_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.procure_inhouse
    ADD CONSTRAINT procure_inhouse_pkey PRIMARY KEY (id);


--
-- Name: procure_plan procure_plan_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.procure_plan
    ADD CONSTRAINT procure_plan_pkey PRIMARY KEY (id);


--
-- Name: procure_return procure_return_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.procure_return
    ADD CONSTRAINT procure_return_pkey PRIMARY KEY (id);


--
-- Name: purchase_order purchase_order_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.purchase_order
    ADD CONSTRAINT purchase_order_pkey PRIMARY KEY (id);


--
-- Name: retail_members retail_members_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.retail_members
    ADD CONSTRAINT retail_members_pkey PRIMARY KEY (id);


--
-- Name: retail_orders retail_orders_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.retail_orders
    ADD CONSTRAINT retail_orders_pkey PRIMARY KEY (id);


--
-- Name: retail_recharge retail_recharge_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.retail_recharge
    ADD CONSTRAINT retail_recharge_pkey PRIMARY KEY (id);


--
-- Name: roles roles_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT roles_pkey PRIMARY KEY (id);


--
-- Name: sale_contracts sale_contracts_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.sale_contracts
    ADD CONSTRAINT sale_contracts_pkey PRIMARY KEY (id);


--
-- Name: sale_customers sale_customers_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.sale_customers
    ADD CONSTRAINT sale_customers_pkey PRIMARY KEY (id);


--
-- Name: sale_offers sale_offers_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.sale_offers
    ADD CONSTRAINT sale_offers_pkey PRIMARY KEY (id);


--
-- Name: sale_out_order sale_out_order_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.sale_out_order
    ADD CONSTRAINT sale_out_order_pkey PRIMARY KEY (id);


--
-- Name: sale_return_order sale_return_order_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.sale_return_order
    ADD CONSTRAINT sale_return_order_pkey PRIMARY KEY (id);


--
-- Name: staff staff_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.staff
    ADD CONSTRAINT staff_pkey PRIMARY KEY (id);


--
-- Name: stock_checks stock_checks_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.stock_checks
    ADD CONSTRAINT stock_checks_pkey PRIMARY KEY (id);


--
-- Name: stock_flow stock_flow_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.stock_flow
    ADD CONSTRAINT stock_flow_pkey PRIMARY KEY (id);


--
-- Name: stock_inventory stock_inventory_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.stock_inventory
    ADD CONSTRAINT stock_inventory_pkey PRIMARY KEY (id);


--
-- Name: stock_other_in stock_other_in_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.stock_other_in
    ADD CONSTRAINT stock_other_in_pkey PRIMARY KEY (id);


--
-- Name: stock_other_out stock_other_out_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.stock_other_out
    ADD CONSTRAINT stock_other_out_pkey PRIMARY KEY (id);


--
-- Name: supplier supplier_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.supplier
    ADD CONSTRAINT supplier_pkey PRIMARY KEY (id);


--
-- Name: sys_params sys_params_key_key; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.sys_params
    ADD CONSTRAINT sys_params_key_key UNIQUE (key);


--
-- Name: sys_params sys_params_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.sys_params
    ADD CONSTRAINT sys_params_pkey PRIMARY KEY (id);


--
-- Name: warehouses warehouses_pkey; Type: CONSTRAINT; Schema: public; Owner: neondb_owner
--

ALTER TABLE ONLY public.warehouses
    ADD CONSTRAINT warehouses_pkey PRIMARY KEY (id);


--
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: public; Owner: cloud_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE cloud_admin IN SCHEMA public GRANT ALL ON SEQUENCES TO neon_superuser WITH GRANT OPTION;


--
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: public; Owner: cloud_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE cloud_admin IN SCHEMA public GRANT ALL ON TABLES TO neon_superuser WITH GRANT OPTION;


--
-- PostgreSQL database dump complete
--

\unrestrict TgOaVOCf2EA2SAf1PlWm1ZNZ6MiWXFFW8FfbIr6ifl4jNqflGZ7E4i5OeG1mYfp

